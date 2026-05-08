import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, X, ExternalLink } from 'lucide-react'
import { globalSearch } from '../../api/analytics'
import { useDebounce } from '../../hooks/useDebounce'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

export default function SidebarSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const searchRef = useRef(null)

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const res = await globalSearch(debouncedQuery)
        setResults(res.data.results)
        setIsOpen(true)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [debouncedQuery])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative px-2 mb-4" ref={searchRef}>
      <div className="relative group">
        <Search 
          size={16} 
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
            query ? "text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
          )} 
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Global search..."
          className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
        />
        {loading ? (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--text-muted)]" />
        ) : query ? (
          <button 
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-red-500 transition-colors"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Results Dropdown */}
      {isOpen && (results.length > 0 || debouncedQuery.length >= 2) && (
        <div className="absolute left-2 right-2 top-full mt-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[300px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-[var(--text-muted)]">No results found for "{debouncedQuery}"</p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((res, i) => (
                  <Link
                    key={i}
                    to={res.link}
                    onClick={() => { setIsOpen(false); setQuery(''); }}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[var(--bg-secondary)] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-light)] px-1.5 py-0.5 rounded">
                          {res.type}
                        </span>
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{res.title}</p>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{res.subtitle}</p>
                    </div>
                    <ExternalLink size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
