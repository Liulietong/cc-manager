import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { SessionsPage } from './pages/SessionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PluginsPage } from './pages/PluginsPage';
import { SkillsPage } from './pages/SkillsPage';
import { MCPPage } from './pages/MCPPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { SSEProvider } from './hooks/SSEContext';

function App() {
  return (
    <SSEProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<SessionsPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/plugins" element={<PluginsPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/mcp" element={<MCPPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
        </Routes>
      </Layout>
    </SSEProvider>
  );
}

export default App;
