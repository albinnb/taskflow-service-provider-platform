import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaRegCalendarCheck, FaUserShield, FaTools, FaBolt, FaHome } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';

const HomePage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query.trim())}`);
    }
  };

  const popularCategories = [
    { name: 'Cleaning', icon: FaHome, query: 'cleaning', image: 'https://images.unsplash.com/photo-1627905646269-7f034dcc5738?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2xlYW5pbmclMjBzZXJ2aWNlc3xlbnwwfHwwfHx8MA%3D%3D' },
    { name: 'Electrical', icon: FaBolt, query: 'electrical', image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500&auto=format&fit=crop&q=60' },
    { name: 'Plumbing', icon: FaTools, query: 'plumbing', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&auto=format&fit=crop&q=60' },
    { name: 'Moving', icon: FaUserShield, query: 'moving', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=500&auto=format&fit=crop&q=60' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* TASKRABBIT STYLE HERO */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            <div className="space-y-8">
              <h1 className="text-4xl md:text-6xl/tight font-extrabold text-foreground tracking-tight">
                Help when you <br />
                <span className="text-primary italic">need it.</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                Get more done with the help of trusted local Taskers.
                From home repairs to cleaning, we've got you covered.
              </p>

              <div className="w-full max-w-lg bg-card p-2 rounded-full shadow-lg border border-border flex items-center">
                <Input
                  className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-lg px-6 h-14"
                  placeholder="What help do you need?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button
                  onClick={handleSearch}
                  className="rounded-full h-12 px-8 font-bold text-base shadow-md transition-transform active:scale-95"
                  size="lg"
                >
                  Search
                </Button>
              </div>

              <div className="flex gap-4 pt-4">
                {popularCategories.slice(0, 3).map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => navigate(`/search?query=${cat.query}`)}
                    className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors border border-border rounded-full px-4 py-2 bg-secondary/50 hover:bg-secondary"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Illustration Placeholder */}
            <div className="hidden lg:block relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl opacity-50"></div>
              <img
                src="https://images.unsplash.com/photo-1678132218412-0f18fab9b537?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDE3fHx8ZW58MHx8fHx8"
                alt="TaskFlow Hero"
                className="relative rounded-2xl shadow-2xl border border-border object-cover h-[500px] w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES GRID */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Popular Projects</h2>
            <p className="text-muted-foreground">Most requested services in your area.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {popularCategories.map((cat) => (
              <Card
                key={cat.name}
                className="border-0 shadow-sm hover:shadow-xl transition-all cursor-pointer group bg-card overflow-hidden"
                onClick={() => navigate(`/search?query=${cat.query}`)}
              >
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                </div>
                <CardContent className="p-4 flex flex-col items-center justify-center space-y-2 text-center relative">
                  <div className="absolute -top-8 bg-card rounded-full p-2 shadow-sm border border-border">
                    <cat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="pt-4">
                    <h3 className="font-bold text-lg">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Starting at ₹500/hr</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;