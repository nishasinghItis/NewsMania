import { useEffect, useState } from 'react';
import axios from 'axios';
import { Newspaper, Calendar, ExternalLink, Sparkles, Search, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

function App() {
  const [query, setQuery] = useState('latest');
  const [groupedArticles, setGroupedArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [summarising, setSummarising] = useState(null);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState(['latest']);

  const trendingTopics = ['SpaceX', 'Entertainment', 'Stock Market', 'AI', 'Travel', 'Business', 'Culture', 'Art'];

  useEffect(() => {
    fetchNews(query);
  }, []);

  const fetchNews = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:5000/api/news', {
        params: { query: searchTerm.trim() },
        timeout: 10000
      });

      setGroupedArticles(response.data);
      if (!searchHistory.includes(searchTerm.trim())) {
        setSearchHistory(prev => [searchTerm.trim(), ...prev.slice(0, 4)]);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to fetch news. Please try again later.');
      }
      setGroupedArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const summariseArticle = async (article) => {
    if (!article.title && !article.description) {
      setError('Cannot summarize: Article content not available.');
      return;
    }

    setSummarising(article.url);
    try {
      const textToSummarize = `${article.title || ''} - ${article.description || ''}`.trim();
      const response = await axios.post('http://localhost:5000/api/summarise', { text: textToSummarize }, { timeout: 30000 });

      setSummaries(prev => ({ ...prev, [article.url]: response.data.summary }));
    } catch (err) {
      console.error('Error summarising:', err);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setSummarising(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNews(query);
  };

  const handleTrendingClick = (topic) => {
    setQuery(topic);
    fetchNews(topic);
  };

  const handleHome = () => {
    setQuery('latest');
    fetchNews('latest');
  };

  const handleRefresh = () => {
    fetchNews(query);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4 md:gap-0">
            <h1
              className="text-3xl font-black bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform duration-200 flex items-center gap-2"
              onClick={handleHome}
            >
              📰 NewsMania
            </h1>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="hidden md:flex items-center gap-1 text-gray-500 text-sm font-medium mr-2">
                <TrendingUp className="w-4 h-4" /> Trending:
              </span>
              {trendingTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleTrendingClick(topic)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 hover:shadow-md hover:scale-105 ${
                    query === topic
                      ? 'text-white bg-gradient-to-r from-red-500 to-pink-500 border-transparent'
                      : 'text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 border-gray-200 hover:border-transparent'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSearch} className="flex justify-center mb-8">
          <div className="relative w-full max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for news, topics, or sources..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-lg bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500 transition-all duration-200"
              disabled={loading}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium disabled:opacity-50"
                disabled={loading || !query.trim()}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors duration-200"
            >
              ×
            </button>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 1 && !loading && (
          <div className="max-w-2xl mx-auto mb-8">
            <p className="text-sm text-gray-500 mb-2">Recent searches:</p>
            <div className="flex flex-wrap gap-2">
              {searchHistory.slice(1).map((term, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(term);
                    fetchNews(term);
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors duration-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
            <p className="text-gray-600 font-medium">
              {query === 'latest' ? 'Loading latest news...' : `Searching for "${query}"...`}
            </p>
          </div>
        )}

        {/* Articles */}
        {!loading && groupedArticles.length > 0 && (
          <div className="space-y-12">
            {groupedArticles.map((group) => (
              <div key={group.source}>
                <div className="sticky top-20 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 capitalize flex items-center gap-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-pink-600 rounded-full"></div>
                    {group.source}
                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {group.articles.length} articles
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {group.articles.map((article, idx) => (
                    <div
                      key={idx}
                      className="group bg-white rounded-3xl shadow-md hover:shadow-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                    >
                      <div className="relative">
                        {article.urlToImage ? (
                          <img
                            src={article.urlToImage}
                            alt={article.title}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <Newspaper className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-bold text-lg mb-3 text-gray-900 line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3">{article.description || 'No description.'}</p>
                        {article.author && <p className="text-sm text-gray-500 mb-2">By {article.author}</p>}
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Read full article <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => summariseArticle(article)}
                          disabled={summarising === article.url}
                          className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          <Sparkles className={`w-4 h-4 ${summarising === article.url ? 'animate-pulse' : ''}`} />
                          {summarising === article.url ? 'Summarising...' : 'AI Summary'}
                        </button>
                        {summaries[article.url] && (
                          <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium text-blue-600">AI Summary:</span> {summaries[article.url]}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Nisha Singh. All rights reserved.</p>
          <p>Powered by NewsMania</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
