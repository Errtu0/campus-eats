import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { ADMIN_URL } from '../../src/config';
import { COLORS } from '../../src/styles/theme';
import { Store, ChevronRight, Plus } from 'lucide-react-native';

export default function RestaurantSelectScreen({ navigation, route }) {
  const { user } = route.params; 
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminRestaurants();
  }, []);

  const fetchAdminRestaurants = async () => {
    try {
      // Fetch restaurants OWNED by this admin ID
      const res = await fetch(`${ADMIN_URL}/my-restaurants?adminId=${user.id}`);
      const data = await res.json();
      setRestaurants(data);
    } catch (e) {
      console.error("Selection Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (restaurant) => {
    // Navigate to Dashboard with the SPECIFIC restaurant context
    navigation.navigate('AdminDashboard', { restaurant, user });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.welcome}>Welcome, {user.username}</Text>
        <Text style={styles.title}>Select Branch</Text>

        {loading ? <ActivityIndicator size="large" color={COLORS.secondary} /> : (
          <FlatList
            data={restaurants}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconCircle}>
                    <Store color={COLORS.secondary} size={24} />
                  </View>
                  <View>
                    <Text style={styles.resName}>{item.name}</Text>
                    <Text style={styles.resAddress}>{item.address}</Text>
                  </View>
                </View>
                <ChevronRight color="#000" size={20} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No restaurants linked to your account.</Text>
            }
          />
        )}

        <TouchableOpacity style={styles.addBtn}>
          <Plus color="#fff" size={20} />
          <Text style={styles.addBtnText}>REGISTER NEW BRANCH</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB' },
  inner: { padding: 25, flex: 1 },
  welcome: { fontSize: 14, fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase' },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 30, marginTop: 5 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    // Neobrutalist Shadow
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    elevation: 5
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  resName: { fontSize: 18, fontWeight: '900' },
  resAddress: { fontSize: 12, fontWeight: '600', color: '#666' },
  addBtn: {
    backgroundColor: COLORS.secondary,
    borderWidth: 3,
    borderColor: '#000',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 'auto'
  },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 50, fontWeight: '700', color: '#999' }
});