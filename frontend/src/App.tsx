import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { theme } from './shared/styles/theme';
import { AppRouter } from './router/AppRouter';

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
