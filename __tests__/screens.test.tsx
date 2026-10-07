import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../src/theme/themeContext';
import { HomeScreen } from '../src/screens/HomeScreen';
import { ExploreScreen } from '../src/screens/ExploreScreen';
import { SearchScreen } from '../src/screens/SearchScreen';
import { SettingsScreen } from '../src/screens/SettingsScreen';
import { DiagnosticsScreen } from '../src/screens/DiagnosticsScreen';
import { AboutScreen } from '../src/screens/AboutScreen';
import { PrivacyScreen } from '../src/screens/PrivacyScreen';
import { HelpScreen } from '../src/screens/HelpScreen';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      <ThemeProvider>{component}</ThemeProvider>
    </NavigationContainer>
  );
};

describe('Screen UI Rendering & Smoke Test Suite', () => {
  it('renders HomeScreen without crashing', () => {
    const { getByText } = renderWithProviders(<HomeScreen />);
    expect(getByText('Your Music')).toBeTruthy();
    expect(getByText('By Anzles')).toBeTruthy();
  });

  it('renders ExploreScreen without crashing', () => {
    const { getByText } = renderWithProviders(<ExploreScreen />);
    expect(getByText('Explore & Discover')).toBeTruthy();
  });

  it('renders SearchScreen with search input', () => {
    const { getByTestId } = renderWithProviders(<SearchScreen />);
    expect(getByTestId('search-input')).toBeTruthy();
  });

  it('renders SettingsScreen with theme options', () => {
    const { getByText } = renderWithProviders(<SettingsScreen />);
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Appearance')).toBeTruthy();
  });

  it('renders DiagnosticsScreen with VERIFIED WORKING indicator', () => {
    const { getByText } = renderWithProviders(<DiagnosticsScreen />);
    expect(getByText(/VERIFIED WORKING/i)).toBeTruthy();
  });

  it('renders AboutScreen with By Anzles branding', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);
    expect(getByText('By Anzles')).toBeTruthy();
  });

  it('renders PrivacyScreen and HelpScreen correctly', () => {
    const privacy = renderWithProviders(<PrivacyScreen />);
    expect(privacy.getByText('Privacy Policy')).toBeTruthy();

    const help = renderWithProviders(<HelpScreen />);
    expect(help.getByText('Help & Support')).toBeTruthy();
  });
});
