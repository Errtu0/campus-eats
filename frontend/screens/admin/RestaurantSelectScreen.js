import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView, 
  Modal, 
  TextInput, 
  Alert 
} from 'react-native';
import { ADMIN_URL } from '../../src/config';
import { COLORS } from '../../src/styles/theme';
import { Store, ChevronRight, Plus, LogOut } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RestaurantSelectScreen({ navigation, route }) {
  const { user } = route.params; 
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Registration States
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', address: '' });

  useEffect(() => {
    fetchAdminRestaurants();
  }, []);

  const fetchAdminRestaurants = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // We no longer need adminId in query because the Backend gets it from the Token!
      const res = await fetch(`${ADMIN_URL}/my-restaurants`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      
      if (res.ok) {
        setRestaurants(data);
      } else {
        Alert.alert("Auth Error", data.error || "Could not fetch branches");
      }
    } catch (e) {
      console.error("Selection Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterBranch = async () => {
    if (!newBranch.name || !newBranch.address) {
      return Alert.alert("Error", "Please fill in all fields.");
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/register-branch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBranch)
      });

      const data = await res.json();

      if (res.ok) {
        setAddModalVisible(false);
        setNewBranch({ name: '', address: '' });
        fetchAdminRestaurants(); // Refresh the list
      } else {
        Alert.alert("Error", data.error || "Failed to create branch");
      }
    } catch (e) {
      Alert.alert("Error", "Server unreachable");
    }
  };

  const handleAdminLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (e) {
      console.error("Logout Error", e);
    }
  };

  const handleSelect = (restaurant) => {
    navigation.navigate('AdminDashboard', { restaurant, user });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* TOP HEADER SECTION */}
        <Text style={styles.welcomeLabel}>Welcome, {user.username}</Text>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Select Branch</Text>
          <TouchableOpacity onPress={handleAdminLogout} style={styles.logoutBtn}>
            <LogOut color={COLORS.secondary} size={24} />
          </TouchableOpacity>
        </View>

        {/* LIST SECTION */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={restaurants}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 100 }}
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
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No restaurants linked to your account.</Text>
              </View>
            }
          />
        )}

        {/* REGISTER BUTTON */}
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => setAddModalVisible(true)}
        >
          <Plus color="#fff" size={20} />
          <Text style={styles.addBtnText}>REGISTER NEW BRANCH</Text>
        </TouchableOpacity>
      </View>

      {/* REGISTRATION MODAL */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>NEW BRANCH</Text>
            
            <TextInput 
              placeholder="Branch Name (e.g. Downtown)" 
              style={styles.input} 
              placeholderTextColor="#999"
              value={newBranch.name}
              onChangeText={t => setNewBranch({...newBranch, name: t})}
            />
            
            <TextInput 
              placeholder="Address" 
              style={styles.input} 
              placeholderTextColor="#999"
              value={newBranch.address}
              onChangeText={t => setNewBranch({...newBranch, address: t})}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleRegisterBranch}>
              <Text style={styles.saveBtnText}>CREATE BRANCH</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAddModalVisible(false)} style={{ marginTop: 20 }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB' },
  inner: { padding: 25, flex: 1 },
  welcomeLabel: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#666', 
    textTransform: 'uppercase',
    marginTop: 20 
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 5,
  },
  title: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: COLORS.secondary, 
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#000',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    elevation: 5
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: { 
    width: 45, 
    height: 45, 
    borderRadius: 25, 
    backgroundColor: '#eee', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2 
  },
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
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
  },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontWeight: '700', color: '#999' },
  
  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    width: '90%', 
    backgroundColor: '#FDFBEB', 
    borderWidth: 4, 
    borderColor: '#000', 
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
  },
  modalTitle: { 
    fontSize: 28, 
    fontWeight: '900', 
    marginBottom: 20, 
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  input: { 
    borderWidth: 3, 
    borderColor: '#000', 
    padding: 15, 
    marginBottom: 15, 
    backgroundColor: '#fff', 
    fontWeight: '700',
    fontSize: 16
  },
  saveBtn: { 
    backgroundColor: COLORS.primary, 
    padding: 18, 
    alignItems: 'center', 
    borderWidth: 3, 
    borderColor: '#000' 
  },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  cancelText: { 
    textAlign: 'center', 
    fontWeight: '900', 
    textDecorationLine: 'underline',
    fontSize: 14
  }
});