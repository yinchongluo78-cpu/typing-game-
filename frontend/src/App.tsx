import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage, PlayPage, ResultPage, ProfilePage, LoginPage, RegisterPage, VocabularyPage, MasteredPage } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/play/:chapterId" element={<PlayPage />} />
        <Route path="/result/:recordId" element={<ResultPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/vocabulary" element={<VocabularyPage />} />
        <Route path="/mastered" element={<MasteredPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
