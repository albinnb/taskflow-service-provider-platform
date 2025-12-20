import React from 'react';
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

/**
 * @desc Redesigned card component.
 */
const ServiceCard = ({ service }) => {
  if (!service || !service.providerId) return null;

  const provider = service.providerId;
  const providerName = provider.businessName || 'N/A';
  const rating = provider.ratingAvg ? provider.ratingAvg.toFixed(1) : 'New';

  return (
    <Card className="flex flex-col md:flex-row overflow-hidden transition-all hover:shadow-lg">

      {/* Image Placeholder */}
      <div className="md:w-1/3 h-48 md:h-auto bg-muted flex-shrink-0 relative">
        <img
          src={service.images[0]?.url || 'https://images.unsplash.com/photo-1517646287270-a5a90701800c?q=80&w=800&auto=format&fit=crop'}
          alt={service.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between md:w-2/3">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold mb-1">
                <Link to={`/service/${service._id}`} className="hover:text-primary transition-colors">
                  {service.title}
                </Link>
              </h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {service.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-2 mt-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <FaMapMarkerAlt className="w-4 h-4 mr-2 text-primary" />
              {service.distance ? (
                <span className="font-semibold text-foreground mr-1">
                  {service.distance.toFixed(1)} km •
                </span>
              ) : null}
              {provider.address?.city_district || provider.address?.city || provider.location?.formattedAddress || 'Location Unknown'}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <FaStar className="w-4 h-4 mr-2 text-yellow-500" />
              <span className="font-medium text-foreground mr-1">{rating}</span>
              ({provider.reviewCount || 0} reviews)
            </div>
            <div className="text-sm text-muted-foreground">
              Tasker:
              <Link to={`/provider/${provider._id}`} className='font-medium text-primary hover:underline ml-1'>
                {providerName}
              </Link>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/30 p-6 pt-4 flex justify-between items-center border-t">
          <div>
            <p className="text-2xl font-bold text-foreground">
              ₹{service.price.toFixed(2)}
              <span className="text-sm text-muted-foreground font-normal ml-1">
                / {service.durationMinutes} min
              </span>
            </p>
          </div>
          <Link to={`/service/${service._id}`}>
            <Button>Book Now</Button>
          </Link>
        </CardFooter>
      </div>
    </Card>
  );
};

export default ServiceCard;
