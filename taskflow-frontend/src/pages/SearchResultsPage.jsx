import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { coreApi } from '../api/serviceApi';
import ServiceCard from '../components/provider/ServiceCard';
import FilterSidebar from '../components/search/FilterSidebar';
import { toast } from 'react-toastify';
import { FaChevronLeft, FaChevronRight, FaMapMarkedAlt, FaList } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Fix for default Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

/**
 * @desc Redesigned page to display search results (with Dark Mode).
 */
const SearchResultsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    // Get user state and auth status
    const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

    const [filters, setFilters] = useState({
        query: searchParams.get('query') || '',
        page: searchParams.get('page') || 1,
        limit: 10,
        sort: searchParams.get('sort') || '-ratingAvg',
        category: searchParams.get('category') || '',
    });

    useEffect(() => {
        // Do not proceed if the authentication state is still loading
        if (authLoading) return;

        const fetchServices = async () => {
            setLoading(true);

            // Start with base filters
            const params = { ...filters };

            // GEO-SEARCH: Location injection logic.
            if (filters.lat && filters.lng) {
                params.lat = filters.lat;
                params.lng = filters.lng;
            }

            // Clean up empty parameters before sending
            Object.keys(params).forEach(key => (params[key] === '' || params[key] === undefined) && delete params[key]);

            try {
                const res = await coreApi.searchServices(params);
                setServices(res.data.data);
                setTotalCount(res.data.total);
            } catch (error) {
                // Updated error message to reflect non-geo search
                toast.error('Failed to fetch services. Check API endpoint and filters.');
                console.error(error);
                setServices([]);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();

        // Update URL parameters (Sync filters to URL) - Geo params are implicitly excluded
        const newParams = new URLSearchParams();
        if (filters.query) newParams.set('query', filters.query);
        if (filters.page > 1) newParams.set('page', filters.page);
        if (filters.sort !== '-ratingAvg') newParams.set('sort', filters.sort);
        if (filters.category) newParams.set('category', filters.category);
        if (filters.lat) newParams.set('lat', filters.lat);
        if (filters.lng) newParams.set('lng', filters.lng);

        setSearchParams(newParams, { replace: true });

    }, [filters, setSearchParams, isAuthenticated, user, authLoading]);

    useEffect(() => {
        const query = searchParams.get('query') || '';
        const sort = searchParams.get('sort') || '-ratingAvg';
        const category = searchParams.get('category') || '';
        const page = searchParams.get('page') || 1;
        const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : undefined;
        const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : undefined;

        setFilters(prev => ({ ...prev, query, sort, category, page, lat, lng }));
    }, [searchParams]);


    const handleFilterChange = (newFilters) => {
        setFilters({ ...newFilters, page: 1 });
    };

    const handlePagination = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    }

    const currentPage = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const totalPages = Math.ceil(totalCount / limit);
    const currentQuery = filters.query;

    return (
        <div className="bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-8">
                    {filters.category ? (
                        <span>Category: <span className="capitalize">{filters.category.replace('-', ' ')}</span></span>
                    ) : (
                        <span>Search Results for: "{currentQuery || 'All Services'}"</span>
                    )}
                </h1>

                <div className="flex justify-end mb-6">
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${viewMode === 'list'
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                                }`}
                        >
                            List View
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('map')}
                            className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${viewMode === 'map'
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                                }`}
                        >
                            Map View
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Filter Sidebar */}
                    <div className="lg:w-1/4">
                        <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
                    </div>

                    {/* Results Area */}
                    <div className="lg:w-3/4">
                        {loading || authLoading ? (
                            <p className="text-center p-20 text-teal-600 dark:text-teal-400 font-semibold">Loading services...</p>
                        ) : services.length === 0 ? (
                            <div className="text-center p-20 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
                                <h3 className="text-2xl font-semibold text-slate-800 dark:text-white">No services found</h3>
                                <p className="text-lg text-slate-500 dark:text-slate-300 mt-2">
                                    Try adjusting your filters.
                                </p>
                            </div>
                        ) : viewMode === 'list' ? (
                            <>
                                <div className="space-y-6 mb-8">
                                    {services.map((service) => (
                                        <ServiceCard key={service._id} service={service} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="flex justify-center items-center space-x-4 mt-10">
                                    <button
                                        onClick={() => handlePagination(currentPage - 1)}
                                        disabled={currentPage <= 1}
                                        className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm text-slate-700 dark:text-slate-200 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-600 transition duration-300"
                                    >
                                        <FaChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-slate-700 dark:text-slate-200 font-medium">Page {currentPage} of {totalPages}</span>
                                    <button
                                        onClick={() => handlePagination(currentPage + 1)}
                                        disabled={currentPage >= totalPages}
                                        className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm text-slate-700 dark:text-slate-200 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-600 transition duration-300"
                                    >
                                        <FaChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="h-[600px] rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
                                <MapContainer
                                    center={filters.lat && filters.lng ? [filters.lat, filters.lng] : [9.9312, 76.2673]}
                                    zoom={11}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {services.map((service) => (
                                        service.providerId?.location?.coordinates && (
                                            <Marker
                                                key={service._id}
                                                position={[
                                                    service.providerId.location.coordinates[1],
                                                    service.providerId.location.coordinates[0]
                                                ]}
                                            >
                                                <Popup>
                                                    <div className="p-1">
                                                        <h4 className="font-bold text-slate-800">{service.title}</h4>
                                                        <p className="text-sm text-slate-600">₹{service.price} / hr</p>
                                                        <Link
                                                            to={`/service/${service._id}`}
                                                            className="text-teal-600 font-semibold hover:underline mt-2 block"
                                                        >
                                                            View Details
                                                        </Link>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )
                                    ))}
                                </MapContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchResultsPage;