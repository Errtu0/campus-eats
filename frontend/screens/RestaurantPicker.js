import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, GLOBAL_STYLES } from '../src/styles/theme';
import { RESTAURANT_URL } from '../src/config';

export default function RestaurantPicker({ navigation, route }) {
  const { user } = route.params;
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch(RESTAURANT_URL);
      const json = await response.json();
      console.log("RESTAURANT DATA LOADED:", json.length, "items");
      setRestaurants(json);
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const getDensityColor = (percent) => {
    if (percent >= 90) return '#FF4444'; 
    if (percent >= 50) return '#FFBB33'; 
    return '#00C851'; 
  };

  const selectRestaurant = (item) => {
    navigation.replace('CustomerTabs', { 
      user, 
      restaurantId: item.id, 
      restaurantName: item.name 
    });
  };

  return (
    <View style={[GLOBAL_STYLES.container, { flex: 1 }]}>
      <Text style={styles.title}>CHOOSE A LOCATION</Text>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={item => item.id.toString()}
          // This ensures the list takes up the available space
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRestaurants(); }} />
          }
          renderItem={({ item }) => {
            // SAFE DATA CHECK
            const tables = item.tables || [];
            const totalTables = tables.length;
            const occupiedTables = tables.filter(t => t.status !== 'EMPTY').length;
            
            // Logic: If no tables exist yet, use the seat capacity for the density bar
            let density = 0;
            if (totalTables > 0) {
              density = Math.round((occupiedTables / totalTables) * 100);
            } else if (item.total_capacity > 0) {
              density = Math.round((item.current_occupancy / item.total_capacity) * 100);
            }

            return (
              <TouchableOpacity 
                style={[styles.restaurantCard, { borderLeftColor: getDensityColor(density) }]} 
                onPress={() => selectRestaurant(item)}
              >
                <View style={styles.infoArea}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  
                  <Text style={styles.capacityText}>
                    {totalTables > 0 
                      ? `${occupiedTables} / ${totalTables} Tables Occupied` 
                      : `Capacity: ${item.total_capacity} Seats`}
                  </Text>
                  
                  <Text style={styles.subtext}>
                    Current Density: {item.current_occupancy} People Inside
                  </Text>
                </View>
                
                <View style={styles.densityBadge}>
                  <Text style={[styles.occupancy, { color: getDensityColor(density) }]}>
                    {density}%
                  </Text>
                  <Text style={styles.densityLabel}>FULL</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          // If the list is empty, show this
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: COLORS.secondary }}>No restaurants found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { 
    fontSize: 24, 
    fontWeight: '900', 
    marginTop: 60, 
    marginBottom: 20, 
    textAlign: 'center', 
    color: COLORS.secondary, 
    letterSpacing: 1 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 50 
  },
  restaurantCard: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#000',
    borderLeftWidth: 12, // Thick brand stripe
    // Neumorphic shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 5,
  },
  infoArea: { 
    flex: 1, 
    paddingRight: 10 
  },
  name: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#000', 
    textTransform: 'uppercase',
    marginBottom: 4
  },
  capacityText: { 
    fontSize: 14, 
    color: COLORS.text, 
    fontWeight: '700' 
  },
  subtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic'
  },
  densityBadge: { 
    alignItems: 'center', 
    justifyContent: 'center',
    minWidth: 65,
    borderLeftWidth: 1,
    borderLeftColor: '#EEE',
    paddingLeft: 10
  },
  occupancy: { 
    fontSize: 22, 
    fontWeight: '900' 
  },
  densityLabel: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#888' 
  }
});