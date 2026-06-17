import math
from typing import Type, TypeVar, List, Generic, Optional, Any
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select
from fastapi import Query

T = TypeVar("T")

class PaginationParams:
    """FastAPI query parameter dependency for pagination, searching, and sorting."""
    
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(20, ge=1, le=100, description="Page size"),
        search: Optional[str] = Query(None, description="Search query term"),
        sort_by: str = Query("created_at", description="Field to sort by"),
        order: str = Query("desc", description="Sort order (asc or desc)"),
    ):
        self.page = page
        self.page_size = page_size
        self.search = search
        self.sort_by = sort_by
        self.order = order.lower()
        if self.order not in ("asc", "desc"):
            self.order = "desc"


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic pagination response envelope."""
    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int


async def paginate(
    db: AsyncSession,
    query: Select,
    model: Type[Any],
    params: PaginationParams,
    search_fields: Optional[List[str]] = None,
) -> dict:
    """Paginate a SQLAlchemy select query, applying optional search filters, sorting, and offset/limit.

    Args:
        db: Async database session
        query: Select statement
        model: SQLAlchemy model class
        params: Pagination request parameters
        search_fields: List of model attribute names to apply wildcard search to

    Returns:
        Dict matching PaginatedResponse structure
    """
    # 1. Apply Search
    if params.search and search_fields:
        search_filters = []
        for field_name in search_fields:
            field = getattr(model, field_name, None)
            if field is not None:
                search_filters.append(field.ilike(f"%{params.search}%"))
        if search_filters:
            query = query.filter(or_(*search_filters))

    # 2. Apply Sorting
    sort_field_name = params.sort_by
    sort_field = getattr(model, sort_field_name, None)

    # Fallback to model fields if requested field is missing
    if sort_field is None:
        if sort_field_name in ("created_at", "updated_at"):
            if hasattr(model, "created_at"):
                sort_field = model.created_at
            elif hasattr(model, "id"):
                sort_field = model.id
        elif sort_field_name == "title":
            if hasattr(model, "title"):
                sort_field = model.title
            elif hasattr(model, "id"):
                sort_field = model.id

    # Ultimate fallback
    if sort_field is None:
        if hasattr(model, "created_at"):
            sort_field = model.created_at
        else:
            sort_field = model.id

    if sort_field is not None:
        if params.order == "desc":
            query = query.order_by(sort_field.desc())
        else:
            query = query.order_by(sort_field.asc())

    # 3. Efficient Count (using subquery to count final query results)
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()

    # 4. Limit/Offset
    offset = (params.page - 1) * params.page_size
    paginated_query = query.offset(offset).limit(params.page_size)

    result = await db.execute(paginated_query)
    items = list(result.scalars().all())

    pages = math.ceil(total / params.page_size) if total > 0 else 0

    return {
        "items": items,
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
        "pages": pages,
    }
