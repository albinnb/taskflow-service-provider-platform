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
    { name: 'Cleaning', icon: FaHome, query: 'cleaning' },
    { name: 'Electrical', icon: FaBolt, query: 'electrical' },
    { name: 'Plumbing', icon: FaTools, query: 'plumbing' },
    { name: 'Moving', icon: FaUserShield, query: 'moving' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* TASKRABBIT STYLE HERO */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl/tight font-extrabold text-foreground tracking-tight">
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
                src="https://images.unsplash.com/photo-1581578731117-104f2a417954?q=80&w=1000&auto=format&fit=crop"
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {popularCategories.map((cat) => (
              <Card
                key={cat.name}
                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-card"
                onClick={() => navigate(`/search?query=${cat.query}`)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="p-4 rounded-full bg-secondary group-hover:bg-primary/10 transition-colors">
                    <cat.icon className="h-8 w-8 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
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