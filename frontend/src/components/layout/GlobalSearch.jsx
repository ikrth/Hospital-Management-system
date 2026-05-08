import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Stethoscope, Calendar, Loader, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { globalSearch } from '../../api/search';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalSearch() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Only render for allowed roles
  if (!user || user.role === 'patient') return null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['globalSearch', debouncedQuery],
    queryFn: () => globalSearch(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000
  });

  const searchResults = data?.data || { patients: [], doctors: [], appointments: [] };
  const hasResults = searchResults.patients.length > 0 || searchResults.doctors.length > 0 || searchResults.appointments.length > 0;

  const handleResultClick = (type, item) => {
    setIsOpen(false);
    setQuery('');
    
    // In a real app we might navigate to specific detail pages
    if (type === 'patient') navigate('/patients');
    if (type === 'doctor') navigate('/doctors');
    if (type === 'appointment') navigate('/appointments');
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md hidden md:block ml-4">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="block w-full pl-10 pr-10 py-2 border border-[var(--border)] rounded-xl leading-5 bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all sm:text-sm"
          placeholder="Search patients, doctors, appointments..."
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <button 
              onClick={() => { setQuery(''); setIsOpen(false); }}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full bg-[var(--bg-card)] shadow-xl rounded-xl border border-[var(--border)] overflow-hidden flex flex-col max-h-[400px]"
          >
            {isLoading ? (
              <div className="p-4 flex items-center justify-center text-[var(--text-muted)]">
                <Loader size={20} className="animate-spin mr-2" /> Searching...
              </div>
            ) : !hasResults ? (
              <div className="p-4 text-center text-[var(--text-muted)] text-sm">
                No results found for "{query}"
              </div>
            ) : (
              <div className="overflow-y-auto p-2 flex flex-col gap-1">
                
                {searchResults.patients.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Patients</div>
                    {searchResults.patients.map(p => (
                      <button 
                        key={p._id} 
                        onClick={() => handleResultClick('patient', p)}
                        className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                          <Users size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.user?.name || p.name}</p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">{p.phone || p.user?.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.doctors.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Doctors</div>
                    {searchResults.doctors.map(d => (
                      <button 
                        key={d._id} 
                        onClick={() => handleResultClick('doctor', d)}
                        className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                          <Stethoscope size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">Dr. {d.user?.name || d.name}</p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">{d.specialization}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.appointments.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Appointments</div>
                    {searchResults.appointments.map(a => (
                      <button 
                        key={a._id} 
                        onClick={() => handleResultClick('appointment', a)}
                        className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                          <Calendar size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                            {a.patient?.user?.name || a.patient?.name} w/ Dr. {a.doctor?.user?.name || a.doctor?.name}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">
                            {new Date(a.date).toLocaleDateString()} at {a.timeSlot}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
