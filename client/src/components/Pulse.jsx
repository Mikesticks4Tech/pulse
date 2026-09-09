import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:5000/api/github";

// Mock responses standing in for Claude until real API billing is added.
// Each takes the real fetched GitHub data and builds a plausible-looking reply,
// so the UI/UX can be fully tested with real commit data but zero AI cost.
function mockAIResponse(userMessage, activityData) {
  const totalCommits = activityData.reduce(
    (sum, repo) => sum + repo.commits.length,
    0,
  );
  const repoNames = activityData.map((r) => r.repo).join(", ");

  if (/summar/i.test(userMessage)) {
    if (totalCommits === 0) {
      return "No commits in the period I checked — looks like a quiet stretch. Want me to look further back?";
    }
    return `You made ${totalCommits} commit${totalCommits === 1 ? "" : "s"} across ${activityData.length} repo${activityData.length === 1 ? "" : "s"} (${repoNames}). [Mock response — this will become a real Claude-generated summary once the API is wired in.]`;
  }

  if (/what.*work/i.test(userMessage) || /today/i.test(userMessage)) {
    return `Based on your recent activity: ${repoNames || "no repos with recent pushes"}. [Mock response — real version will describe what actually changed in each commit.]`;
  }

  return 'I can currently only give mock responses about your GitHub activity — ask me to "summarize my activity" or "what did I work on today" to see how this will work once real AI reasoning is wired in.';
}

const Pulse = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hey! I'm Pulse. Ask me what you worked on recently, or ask for a summary of your GitHub activity.",
    },
  ]);
  const [input, setInput] = useState("");
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchActivity();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchActivity = async () => {
    try {
      const res = await fetch(`${API_BASE}/activity?days=7`);
      const data = await res.json();
      setActivityData(data);
    } catch (err) {
      setError("Couldn't reach the backend — is the server running?");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    // Simulate thinking delay so the UI feels realistic before real AI is wired in
    setTimeout(() => {
      const reply = mockAIResponse(userMessage, activityData);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      setLoading(false);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl flex flex-col h-[85vh] bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
          <h1 className="text-lg font-semibold text-gray-100">Pulse</h1>
          <span className="text-xs text-gray-500 ml-auto">
            {activityData.length > 0
              ? `${activityData.length} active repos`
              : "Loading activity..."}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-800 text-gray-100 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-400 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm">
                Pulse is thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef}></div>
        </div>

        {error && <p className="text-red-400 text-xs px-6 pb-2">{error}</p>}

        <form
          onSubmit={handleSend}
          className="p-4 border-t border-gray-800 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your GitHub activity..."
            className="flex-1 bg-gray-800 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl px-5 py-2.5 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Pulse;
