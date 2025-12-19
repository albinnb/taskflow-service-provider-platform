/**
 * @desc Utility class to handle complex MongoDB querying: filtering, sorting,
 * field limiting, pagination, and text search. (Geo-spatial search removed)
 */
class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.queryFilter = {}; // Used to build up the filter object
  }

  // --- 1. Text Search ---
  search() {
    if (this.queryString.query) {
      this.queryFilter.$text = {
        $search: this.queryString.query,
        $caseSensitive: false,
      };
    }
    return this;
  }

  // --- 2. Filtering (Standard fields) ---
  filter() {
    const queryObj = { ...this.queryString };

    // GEO-SEARCH REMOVAL: Removed 'lat', 'lng', and 'distance' from excludedFields
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'query', 'select'];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // Merge general filters with existing filters (like text search)
    this.queryFilter = { ...this.queryFilter, ...JSON.parse(queryStr) };

    // APPLY THE FILTER TO THE QUERY
    this.query = this.query.find(this.queryFilter);

    return this;
  }

  // ------------------------------------------------------------------
  // GEO-SEARCH REMOVAL: The geoSearch() method is completely removed.
  // ------------------------------------------------------------------

  // Helper to retrieve the current filter object
  getQuery() {
    return this.queryFilter;
  }

  // --- 3. Sorting ---
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // --- 4. Field Limiting ---
  limitFields() {
    if (this.queryString.select) {
      const fields = this.queryString.select.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // --- 5. Pagination ---
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 20;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    this.pagination = { page, limit, skip };

    return this;
  }
}

export default ApiFeatures;