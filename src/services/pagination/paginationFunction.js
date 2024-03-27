//function to calculate pagination variables
function calculatePagination(req) {
  // Extract page and pageSize from request query parameters, with default values if not provided
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  // Calculate skip value for pagination
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
}

export { calculatePagination };
