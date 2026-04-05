import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../src/styles/theme';

export default function ProfileScreen({ route, navigation }) {
  const { user } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>MEMBERSHIP POINTS</Text>
        <Text style={styles.pointsValue}>{user.membership_points || 0}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('SignIn')}>
        <Text style={styles.logoutText}>LOGOUT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 20, alignItems: 'center' },
  headerArea: { marginTop: 80, alignItems: 'center', marginBottom: 40 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { color: '#FFF', fontSize: 40, fontWeight: '900' },
  username: { fontSize: 24, fontWeight: '900', textTransform: 'uppercase' },
  email: { fontSize: 14, color: '#666' },
  pointsCard: { width: '100%', backgroundColor: '#FFF', borderWidth: 2, padding: 30, alignItems: 'center', marginBottom: 40 },
  pointsLabel: { fontSize: 12, fontWeight: '900', color: '#AAA', letterSpacing: 1 },
  pointsValue: { fontSize: 48, fontWeight: '900', marginTop: 10 },
  logoutBtn: { width: '100%', padding: 20, borderWidth: 2, borderColor: '#000', alignItems: 'center' },
  logoutText: { fontWeight: '900', color: '#FF4444' }
});