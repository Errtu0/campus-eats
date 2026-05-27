import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { COLORS, GLOBAL_STYLES } from '../src/styles/theme';
import { RESTAURANT_URL } from '../src/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LogOut, Search, MapPin, Users } from 'lucide-react-native';

export default function RestaurantPicker({ navigation, route }) {
  const { user } = route.params;
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log("FETCHING WITH TOKEN:", token ? "Token Found" : "Token Missing");

      const response = await fetch(RESTAURANT_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 403 || response.status === 401) {
        console.error("AUTH ERROR: Invalid Token");
        handleLogout();
        return;
      }

      const json = await response.json();
      setRestaurants(json);
      setFilteredRestaurants(json);
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = restaurants.filter(r => 
      r.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredRestaurants(filtered);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    } catch (e) {
      console.error("Logout Error", e);
    }
  };

  const getDensityColor = (percent) => {
    if (percent >= 90) return '#FF4444'; 
    if (percent >= 60) return '#FFBB33'; 
    return '#00C851'; 
  };

  const selectRestaurant = (item) => {
    navigation.replace('CustomerTabs', { 
      user, 
      restaurantId: item.id, 
      restaurantName: item.name 
    });
  };

  const renderHeader = () => (
    <View style={styles.heroSection}>
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.greeting}>HELLO,</Text>
          <Text style={styles.username}>{user.username.toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
          <LogOut color="#000" size={24} strokeWidth={3} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Search color="#666" size={20} style={styles.searchIcon} />
        <TextInput
          placeholder="SEARCH LOCATIONS..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      {renderHeader()}
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>LOCATING FLAVORS...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRestaurants(); }} />
          }
          renderItem={({ item }) => {
            // NEW DENSITY LOGIC: Check both total_capacity and tables array
            let density = 0;
            const totalTables = item.tables?.length || 0;
            
            if (totalTables > 0) {
              const occupied = item.tables.filter(t => t.status !== 'EMPTY').length;
              density = Math.round((occupied / totalTables) * 100);
            } else if (item.total_capacity > 0) {
              density = Math.round((item.current_occupancy / item.total_capacity) * 100);
            }

            return (
              <TouchableOpacity 
                style={styles.card} 
                onPress={() => selectRestaurant(item)}
              >
                <View style={[styles.cardTag, { backgroundColor: getDensityColor(density) }]} />
                
                <View style={styles.cardMain}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.restaurantName}>{item.name}</Text>
                    <View style={styles.densityPill}>
                      <Users size={12} color="#666" />
                      <Text style={styles.densityPillText}>{density}%</Text>
                    </View>
                  </View>

                  <View style={styles.locationRow}>
                    <MapPin size={14} color={COLORS.primary} />
                    <Text style={styles.locationText}>ACTIVE BRANCH</Text>
                  </View>

                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { 
                      width: `${Math.min(density, 100)}%`, 
                      backgroundColor: getDensityColor(density) 
                    }]} />
                  </View>
                  
                  <Text style={styles.occupancySubtext}>
                    {totalTables > 0 
                      ? `${item.tables.filter(t => t.status !== 'EMPTY').length} / ${totalTables} TABLES BUSY`
                      : `${item.current_occupancy} PEOPLE CURRENTLY DINING`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>NO BRANCHES FOUND</Text>
              <TouchableOpacity onPress={fetchRestaurants} style={{marginTop: 20}}>
                <Text style={{color: COLORS.primary, fontWeight: '900'}}>RETRY FETCH</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

// ... styles remain exactly the same as provided in your previous message
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FDFBEB' },
  heroSection: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomWidth: 5,
    borderColor: '#000',
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 14, fontWeight: '900', color: '#fff', opacity: 0.8 },
  username: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  logoutIcon: {
    backgroundColor: '#fff',
    padding: 10,
    borderWidth: 3,
    borderColor: '#000',
  },
  searchContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontWeight: '900', fontSize: 14 },
  listContent: { padding: 20, paddingBottom: 50 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
    flexDirection: 'row',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    elevation: 4,
  },
  cardTag: { width: 12, height: '100%', borderRightWidth: 3, borderColor: '#000' },
  cardMain: { flex: 1, padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restaurantName: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  densityPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#eee', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderWidth: 1, 
    borderColor: '#000' 
  },
  densityPillText: { fontSize: 10, fontWeight: '900', marginLeft: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  locationText: { fontSize: 11, fontWeight: '700', color: '#666', marginLeft: 4 },
  progressBarBg: { 
    height: 12, 
    backgroundColor: '#eee', 
    borderWidth: 2, 
    borderColor: '#000', 
    marginTop: 15 
  },
  progressBarFill: { height: '100%' },
  occupancySubtext: { fontSize: 10, fontWeight: '800', color: '#999', marginTop: 8, textTransform: 'uppercase' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  emptyContainer: { marginTop: 50, alignItems: 'center' },
  emptyText: { fontWeight: '900', color: '#ccc' }
});