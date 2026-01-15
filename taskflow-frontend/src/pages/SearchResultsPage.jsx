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
import { Button } from '../components/ui/Button';

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
 * @desc Redesigned page to display search results.
 */
const SearchResultsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);

    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        query: searchParams.get('query') || '',
        page: searchParams.get('page') || 1,
        limit: 10,
        sort: searchParams.get('sort') || '-ratingAvg',
        category: searchParams.get('category') || '',
    });

    useEffect(() => {
        if (authLoading) return;

        const fetchServices = async () => {
            setLoading(true);
            const params = { ...filters };

            if (filters.lat && filters.lng) {
                params.lat = filters.lat;
                params.lng = filters.lng;
            }

            // Fix: Map 'query' to 'keyword' for backend compatibility
            if (filters.query) {
                params.keyword = filters.query;
                delete params.query;
            }

            Object.keys(params).forEach(key => (params[key] === '' || params[key] === undefined) && delete params[key]);

            try {
                const res = await coreApi.searchServices(params);
                setServices(res.data.data);
                setTotalCount(res.data.total);
            } catch (error) {
                toast.error('Failed to fetch services. Check API endpoint and filters.');
                console.error(error);
                setServices([]);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();

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
        <div className="bg-background min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {filters.category ? (
                            <span>Category: <span className="capitalize text-primary">{filters.category.replace('-', ' ')}</span></span>
                        ) : (
                            <span>Search Results for: "<span className="text-primary">{currentQuery || 'All Services'}</span>"</span>
                        )}
                    </h1>

                    <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg">
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="flex items-center"
                        >
                            <FaList className="mr-2 h-4 w-4" /> List
                        </Button>
                        <Button
                            variant={viewMode === 'map' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('map')}
                            className="flex items-center"
                        >
                            <FaMapMarkedAlt className="mr-2 h-4 w-4" /> Map
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Mobile Filter Toggle */}
                    <div className="lg:hidden w-full">
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            variant="outline"
                            className="w-full justify-between"
                        >
                            <span>Filters & Sorting</span>
                            <span className="text-xs text-muted-foreground">{showFilters ? 'Hide' : 'Show'}</span>
                        </Button>
                    </div>

                    {/* Filter Sidebar */}
                    <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                        <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
                    </div>

                    {/* Results Area */}
                    <div className="lg:w-3/4">
                        {loading || authLoading ? (
                            <p className="text-center p-20 text-muted-foreground font-semibold">Loading services...</p>
                        ) : services.length === 0 ? (
                            <div className="text-center p-20 bg-muted/40 rounded-lg border border-dashed">
                                <h3 className="text-xl font-semibold text-foreground">No services found</h3>
                                <p className="text-muted-foreground mt-2">
                                    Try adjusting your filters or search query.
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
                                <div className="flex justify-center items-center space-x-2 mt-10">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePagination(currentPage - 1)}
                                        disabled={currentPage <= 1}
                                    >
                                        <FaChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium mx-2">Page {currentPage} of {totalPages}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePagination(currentPage + 1)}
                                        disabled={currentPage >= totalPages}
                                    >
                                        <FaChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="h-[60vh] lg:h-[600px] rounded-xl overflow-hidden shadow-lg border bg-muted">
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
                                                    <div className="p-1 min-w-[200px]">
                                                        <h4 className="font-bold text-base text-foreground mb-1">{service.title}</h4>
                                                        <p className="text-sm font-semibold text-primary mb-2">₹{service.price} / hr</p>
                                                        <p className="text-xs text-muted-foreground mb-3">{service.providerId?.businessName}</p>
                                                        <Link
                                                            to={`/service/${service._id}`}
                                                            className="block w-full text-center py-2 px-4 bg-primary text-primary-foreground text-sm font-bold rounded hover:opacity-90 transition-opacity"
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

