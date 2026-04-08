import { useEffect, useState } from "react";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase and point to the backend server
const supabase = createClient("https://gsscduiqpoayadmpfbjc.supabase.co", "sb_publishable_wPW6xRQjonzKQg_p_Ty7Ng_1Yxtm2R-");
//const API_BASE_URL = "https://server-9w55.onrender.com";
const API_BASE_URL = "http://localhost:5000";

function App() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("general");
  const [saved, setSaved] = useState([]);
  const [summarizingIdx, setSummarizingIdx] = useState(null);
  const [view, setView] = useState("feed"); 
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [toast, setToast] = useState(null);

  // Quick helper to pop up a notification and hide it after 3 seconds
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Check if someone is already logged in when the app starts up
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUser(data.user); });
  }, []);

  // Handle both account creation and login in one spot
  const handleAuth = async (e) => {
    e.preventDefault();
    const { data, error } = isSignUp ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (error) showToast(error.message); else setUser(data.user);
  };

  // Pull the latest news whenever the category changes or a user logs in
  useEffect(() => {
    if (user) axios.get(`${API_BASE_URL}/news?category=${category}`).then(res => setArticles(res.data.articles || []));
  }, [category, user]);

  // Grab the user's personal reading list from the database
  const fetchSaved = async () => {
    if (user) axios.get(`${API_BASE_URL}/saved?userId=${user.id}`).then(res => setSaved(res.data));
  };
  useEffect(() => { if (user) fetchSaved(); }, [user]);

  // Hit the backend to get an AI-generated summary for a specific article
  const getSummary = async (article, index) => {
    if (summarizingIdx !== null || article.summary) return;
    setSummarizingIdx(index);
    try {
      const res = await axios.post(`${API_BASE_URL}/summarize`, { title: article.title, description: article.description });
      setArticles(articles.map(a => a.title === article.title ? { ...a, summary: res.data.summary } : a));
      showToast("Summary Ready!");
    } catch (err) { showToast("AI Timeout. Try again."); } finally { setSummarizingIdx(null); }
  };

  // Push an article to the user's saved library
  const saveArticle = async (article) => {
    if (saved.some(s => s.url === article.url)) return showToast("Already in Library");
    try {
      await axios.post(`${API_BASE_URL}/save`, { ...article, user_id: user.id });
      showToast("Saved!"); fetchSaved();
    } catch (err) { showToast("Save Failed"); }
  };

  // Remove an article from the library by its ID
  const deleteArticle = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/delete/${id}`);
      showToast("Article Removed"); fetchSaved();
    } catch (err) { showToast("Delete Failed"); }
  };

  // Simple search filter to narrow down the current article list
  const filtered = articles.filter(a => a.title?.toLowerCase().includes(search.toLowerCase()));

  // Show the login/signup screen if there's no active user
  if (!user) return (
    <div style={s.authPage}>
      <div style={s.authCard}>
        <h1 style={s.logoLarge}>NovaNews</h1>
        <p style={{ color: "#94A3B8", marginBottom: '30px', fontSize: '13px' }}>AI-Powered Global Intelligence.</p>
        <form onSubmit={handleAuth} style={s.col}>
          <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} style={s.input} />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} style={s.input} />
          <button style={s.primaryBtn}>{isSignUp ? "Sign Up" : "Sign In"}</button>
        </form>
        <p onClick={() => setIsSignUp(!isSignUp)} style={s.toggle}>{isSignUp ? "Existing User? Login" : "New User? Sign Up"}</p>
      </div>
    </div>
  );

  return (
    <div style={s.dashboard}>
      <style>{globalStyles}</style>
      {toast && <div style={s.toast}>{toast}</div>}

      <aside style={s.sidebar}>
        <h2 style={s.logoSidebar}>NovaNews</h2>
        <nav style={s.col}>
          <p style={s.sidebarLabel}>Sectors</p>
          {["general", "technology", "business", "sports", "health"].map(cat => (
            <button key={cat} onClick={() => { setCategory(cat); setView("feed"); }} className="nav-item" style={{
              ...s.navItem,
              background: (view === "feed" && category === cat) ? "rgba(99, 102, 241, 0.15)" : 'transparent',
              color: (view === "feed" && category === cat) ? "#818CF8" : "#94A3B8"
            }}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
          ))}
          <p style={{...s.sidebarLabel, marginTop: '10px'}}>Personal</p>
          <button onClick={() => setView("library")} className="nav-item" style={{
            ...s.navItem,
            background: view === "library" ? "rgba(99, 102, 241, 0.15)" : 'transparent',
            color: view === "library" ? "#818CF8" : "#94A3B8"
          }}>Private Library 🔒</button>
        </nav>
        <div style={s.userBox}>
          <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '10px' }}>{user.email}</p>
          <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} style={s.logoutBtn}>LOGOUT</button>
        </div>
      </aside>

      <main style={s.main}>
        {view === "feed" ? (
          <>
            <header style={s.header}>
              <h1 style={s.mainHeading}>{category.toUpperCase()} FEED</h1>
              <input type="text" placeholder="Search articles..." onChange={e => setSearch(e.target.value)} style={s.search} />
            </header>
            <div style={s.grid}>
              {filtered.map((a, i) => {
                const isSaved = saved.some(item => item.url === a.url);
                return (
                  <div key={i} className="card" style={s.card}>
                    <div style={s.imgBox}>
                      <img src={a.urlToImage || "https://via.placeholder.com/400x200?text=NovaNews"} style={s.img} alt="n" />
                      <div style={s.badge}>{a.source?.name}</div>
                    </div>
                    <div style={{padding: '24px'}}>
                      <h3 style={s.cardTitle}>{a.title}</h3>
                      <div style={s.row}>
                        <button onClick={() => getSummary(a, i)} style={{...s.btn, background: a.summary ? 'rgba(99, 102, 241, 0.15)' : '#334155', color: a.summary ? '#818CF8' : '#fff'}}>
                          {a.summary ? "READY" : summarizingIdx === i ? "..." : "SUMMARIZE"}
                        </button>
                        <button onClick={() => !isSaved && saveArticle(a)} style={{...s.saveBtn, opacity: isSaved ? 0.5 : 1}}>{isSaved ? "SAVED" : "SAVE"}</button>
                      </div>
                      {a.summary && <div style={s.summaryBox}>{a.summary}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h1 style={s.mainHeading}>Private Library 🔒</h1>
            <div style={{...s.col, marginTop: '20px'}}>
              {saved.length === 0 ? <p style={{color: '#475569'}}>No items archived.</p> : saved.map((item, idx) => (
                <div key={idx} style={s.libItem}>
                  <div style={{flex: 1}}><a href={item.url} target="_blank" rel="noreferrer" style={s.libLink}>{item.title}</a>{item.summary && <p style={{fontSize: '13px', color: '#94A3B8', marginTop: '5px'}}>"{item.summary}"</p>}</div>
                  <button onClick={() => deleteArticle(item.id)} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px'}}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Styling object for the UI components
const s = {
  dashboard: { display: 'flex', height: '100vh', background: '#0F172A', color: '#F8FAFC', fontFamily: "'Inter', sans-serif" },
  authPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0F172A', fontFamily: "'Inter', sans-serif" },
  authCard: { width: '380px', padding: '40px', background: '#1E293B', borderRadius: '32px', textAlign: 'center', border: '1px solid #334155' },
  logoLarge: { fontSize: '42px', fontWeight: '900', margin: 0, background: 'linear-gradient(to right, #818CF8, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-2px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', background: '#0F172A', color: '#fff', border: '1px solid #334155', marginBottom: '10px', boxSizing: 'border-box' },
  primaryBtn: { width: '100%', padding: '14px', borderRadius: '12px', background: 'linear-gradient(to right, #6366F1, #818CF8)', color: '#fff', fontWeight: '800', border: 'none', cursor: 'pointer' },
  toggle: { fontSize: '13px', color: '#818CF8', cursor: 'pointer', marginTop: '20px' },
  sidebar: { width: '240px', background: '#0F172A', padding: '20px', borderRight: '1px solid #1E293B', display: 'flex', flexDirection: 'column' },
  logoSidebar: { fontSize: '24px', fontWeight: '900', marginBottom: '25px', background: 'linear-gradient(to right, #818CF8, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1.5px' },
  sidebarLabel: { fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', paddingLeft: '10px' },
  navItem: { background: 'transparent', border: 'none', padding: '10px 12px', textAlign: 'left', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: '0.2s', width: '100%' },
  userBox: { marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #1E293B' },
  logoutBtn: { width: '100%', padding: '8px', background: 'transparent', border: '1px solid #334155', color: '#F87171', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  mainHeading: { fontSize: '13px', fontWeight: '900', letterSpacing: '2px', color: '#818CF8', margin: 0 },
  search: { background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '10px 20px', color: '#fff', width: '280px', outline: 'none', fontSize: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '30px' },
  card: { background: '#1E293B', borderRadius: '24px', overflow: 'hidden', border: '1px solid #334155', transition: '0.4s' },
  imgBox: { height: '180px', position: 'relative' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  badge: { position: 'absolute', top: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', backdropFilter: 'blur(4px)' },
  cardTitle: { fontSize: '17px', fontWeight: '700', lineHeight: '1.4', margin: 0 },
  row: { display: 'flex', gap: '10px', marginTop: '20px' },
  btn: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  saveBtn: { padding: '10px 15px', borderRadius: '8px', border: 'none', background: '#818CF8', color: '#fff', fontWeight: '800', fontSize: '11px', cursor: 'pointer' },
  summaryBox: { marginTop: '20px', padding: '15px', background: '#0F172A', borderRadius: '12px', fontSize: '13px', color: '#CBD5E1', borderLeft: '4px solid #818CF8', lineHeight: '1.6' },
  libItem: { padding: '18px', background: '#1E293B', borderRadius: '15px', border: '1px solid #334155', marginBottom: '10px', display: 'flex', alignItems: 'center' },
  libLink: { color: '#F8FAFC', fontWeight: '700', textDecoration: 'none', fontSize: '15px' },
  toast: { position: 'fixed', bottom: '30px', right: '30px', background: '#6366F1', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', zIndex: 1000 },
  col: { display: 'flex', flexDirection: 'column', gap: '10px' }
};

const globalStyles = `
  @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  .nav-item:hover { background: rgba(129, 140, 248, 0.05) !important; color: #818CF8 !important; }
  .card:hover { transform: translateY(-8px); border-color: #818CF8; box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
`;

export default App;
