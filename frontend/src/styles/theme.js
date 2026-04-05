// src/styles/theme.js
export const COLORS = {
  primary: '#DD5544',    // Soft Red (Buttons)
  background: '#F4F1DE', // Cream (Background)
  secondary: '#618C82',  // Blueish (Other stuff)
  white: '#FFFFFF',
  black: '#000000',
  text: '#333333',
  danger: '#FF0000',
  tabBar: '#FFFFFF',
  inactive: '#888888',
};

export const GLOBAL_STYLES = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    alignItems: 'center', // Centers children globally
  },
  button: {
    width: 280,            // Enforce identical width for all buttons
    height: 55,           // Enforce identical height
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.black,
    marginBottom: 15,     // Standard spacing
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  // Professional card base
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  input: {
    width: 280,
    height: 55,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderRadius: 8,
    fontSize: 16,
    color: COLORS.text,
  }
};