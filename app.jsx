import { createRoot } from 'react-dom/client';
import { useState, useEffect, useContext, createContext, useMemo, useReducer, memo } from "react";

// ================= CONTEXT & STATE =================
const AppCtx = createContext();
const useApp = () => useContext(AppCtx);

const getInitialState = () => ({
  favorites: JSON.parse(localStorage.getItem("hc_favs")) || [],
  darkMode: JSON.parse(localStorage.getItem("hc_dark")) || false,
});

function reducer(state, action) {
  switch (action.type) {
    case "TOGGLE_DARK":
      localStorage.setItem("hc_dark", JSON.stringify(!state.darkMode));
      return { ...state, darkMode: !state.darkMode };
    case "TOGGLE_FAV":
      const isFav = state.favorites.find(f => f.id === action.payload.id);
      const newFavs = isFav ? state.favorites.filter(f => f.id !== action.payload.id) : [...state.favorites, action.payload];
      localStorage.setItem("hc_favs", JSON.stringify(newFavs));
      return { ...state, favorites: newFavs };
    default: return state;
  }
}

// ================= DETAILED MEDICAL DATABASE =================
// Yahan symptoms bhi saaf-saaf likhe hain
const MEDICAL_DB = [
  { id: 'm1', name: "Viral Fever", symptoms: "High temperature, chills, fatigue", description: "A temporary increase in body temperature, often due to an infection.", precautions: "Stay hydrated, take rest, and monitor temperature." },
  { id: 'm2', name: "Common Cold", symptoms: "Sneezing, runny nose, sore throat", description: "A viral infection of your nose and throat.", precautions: "Drink warm fluids, salt water gargle, and rest." },
  { id: 'm3', name: "Migraine", symptoms: "Severe headache, nausea, light sensitivity", description: "A neurological condition that causes intense, throbbing headaches.", precautions: "Rest in a dark, quiet room; avoid loud noises." },
  { id: 'm4', name: "Allergic Rhinitis", symptoms: "Itchy eyes, sneezing, skin rash", description: "An allergic response to specific allergens like pollen or dust.", precautions: "Avoid known allergens, use air purifiers." }
];

// ================= COMPONENTS =================
const ConditionCard = memo(({ item, onFav, isFav }) => (
  <div style={{
    border: "1px solid #99f6e4", padding: "15px", borderRadius: "12px",
    marginBottom: "15px", backgroundColor: "white", boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    transition: "0.3s"
  }}>
    <div onClick={() => window.location.hash = `#/details/${item.id}`} style={{ cursor: "pointer" }}>
      <h3 style={{ color: "#0d9488", margin: "0 0 5px 0" }}>{item.name}</h3>
      <p style={{ fontSize: "13px", fontWeight: "bold", color: "#0f172a" }}>Symptoms: {item.symptoms}</p>
      <p style={{ fontSize: "14px", color: "#64748b" }}>{item.description}</p>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
       <span style={{ fontSize: "12px", color: "#0d9488" }}>Click for more info →</span>
       <button onClick={() => onFav(item)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer" }}>
        {isFav ? "❤️" : "🤍"}
      </button>
    </div>
  </div>
));

// ================= PAGES =================
function HomePage() {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      // Local symptoms search
      const matches = MEDICAL_DB.filter(m => 
        m.name.toLowerCase().includes(query.toLowerCase()) || 
        m.symptoms.toLowerCase().includes(query.toLowerCase())
      );

      // Public API logic (Simulation for SOP)
      try {
        const res = await fetch(`https://jsonplaceholder.typicode.com/users`);
        const apiData = await res.json();
        const formattedApi = apiData.map(d => ({
          id: d.id,
          name: d.company.bs.toUpperCase(),
          symptoms: "Check detailed report",
          description: `Consult Dr. ${d.name} for specialized treatment.`,
          precautions: "Follow doctor's prescription."
        }));

        const apiMatches = query 
          ? formattedApi.filter(a => a.name.toLowerCase().includes(query.toLowerCase()))
          : formattedApi;

        setResults([...matches, ...apiMatches]);
      } catch (err) {
        setResults(matches);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <header style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#134e4a" }}>Smart Symptom Checker</h2>
        <p style={{ fontSize: "14px", color: "#64748b" }}>Find conditions based on how you feel</p>
      </header>

      <input
        type="text"
        placeholder="Type symptoms (e.g. Fever, Headache, Rash)..."
        style={{ 
            width: "100%", padding: "14px", borderRadius: "10px", 
            border: "2px solid #0d9488", outline: "none", fontSize: "16px" 
        }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div style={{ marginTop: "20px" }}>
        {loading ? <p>Analyzing symptoms...</p> : (
          results.map(item => (
            <ConditionCard 
              key={item.id} 
              item={item} 
              isFav={state.favorites.some(f => f.id === item.id)}
              onFav={(v) => dispatch({ type: "TOGGLE_FAV", payload: v })}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DetailsPage({ id }) {
  const item = MEDICAL_DB.find(m => m.id === id) || { name: "Specialized Condition", description: "Contact medical expert for details.", precautions: "Take rest." };

  return (
    <div style={{ padding: "30px", maxWidth: "600px", margin: "0 auto" }}>
      <button onClick={() => window.location.hash = "#/"} style={{ marginBottom: "20px", cursor: "pointer" }}>← Back to Home</button>
      <div style={{ background: "white", padding: "25px", borderRadius: "15px", border: "1px solid #0d9488" }}>
        <h2 style={{ color: "#0d9488" }}>{item.name}</h2>
        <p><strong>Description:</strong> {item.description}</p>
        <p style={{ color: "#b91c1c" }}><strong>Precautions:</strong> {item.precautions}</p>
      </div>
    </div>
  );
}

// ================= ROUTER & ROOT =================
function AppRouter() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const h = () => setHash(window.location.hash);
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);

  if (hash.startsWith("#/details/")) return <DetailsPage id={hash.split("/")[2]} />;
  return <HomePage />;
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, getInitialState());
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <AppCtx.Provider value={value}>
      <div style={{ minHeight: "100vh", backgroundColor: state.darkMode ? "#0f172a" : "#f0fdfa", color: state.darkMode ? "white" : "black" }}>
        <nav style={{ padding: "15px 20px", display: "flex", justifyContent: "space-between", background: "#0d9488", color: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
          <strong style={{ fontSize: "1.2rem" }}>HealthCheck AI</strong>
          <button onClick={() => dispatch({ type: "TOGGLE_DARK" })} style={{ color: "white", background: "none", border: "1px solid white", borderRadius: "5px", cursor: "pointer", padding: "5px 10px" }}>
            {state.darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </nav>
        <AppRouter />
      </div>
    </AppCtx.Provider>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);