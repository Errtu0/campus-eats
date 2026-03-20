import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Checkbox from 'expo-checkbox';
import { useStripe } from '@stripe/stripe-react-native'; 
import { ORDER_URL, PAYMENT_URL } from '../src/config'; // Fixed imports
import CustomAlert from '../components/CustomAlert';

export default function TableCartScreen({ route, navigation }) {
  const { session, user } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  useEffect(() => {
    fetchTableCart();
  }, []);

  const fetchTableCart = async () => {
    try {
      const response = await fetch(`${ORDER_URL}/session-cart/${session.id}`);
      const data = await response.json();
      setCartItems(data);
    } catch (e) {
      showAlert("Error", "Could not load table cart.");
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const calculateTotal = () => {
    const total = cartItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.item.price, 0);
    return total.toFixed(2);
  };

  const handlePayment = async () => {
    const amount = calculateTotal();
    if (parseFloat(amount) <= 0) return;

    setPaying(true);
    try {
      // 1. Create Payment Intent on Backend using the dedicated PAYMENT_URL
      const response = await fetch(`${PAYMENT_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      const data = await response.json();
      
      if (!data.clientSecret) throw new Error("Could not get payment secret from server");

      // 2. Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: 'CampusEats',
        returnURL: 'campuseats://stripe-redirect', // Add this line
      });

      if (initError) throw new Error(initError.message);

      // 3. Present Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        showAlert("Payment Canceled", paymentError.message);
      } else {
        // 4. Success!
        await confirmPaymentInDB();
        showAlert("Success", "Payment successful! Items marked as paid.");
        navigation.goBack();
      }
    } catch (e) {
      showAlert("Payment Error", e.message);
    } finally {
      setPaying(false);
    }
  };

  const confirmPaymentInDB = async () => {
    for (const itemId of selectedItems) {
      await fetch(`${ORDER_URL}/claim-item`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId: itemId, userId: user.id }),
      });
    }
  };

  const renderItem = ({ item }) => {
    const isPaid = !!item.paid_by_user_id;
    return (
      <View style={[styles.itemRow, isPaid && styles.paidItem]}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.item.name}</Text>
          <Text style={styles.itemSub}>
            {isPaid ? `Paid by ${item.paid_by?.username || 'user'}` : `$${item.item.price}`}
          </Text>
        </View>
        {!isPaid && (
          <Checkbox
            value={selectedItems.includes(item.id)}
            onValueChange={() => toggleItemSelection(item.id)}
            color={selectedItems.includes(item.id) ? '#F1D1E5' : undefined}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertVisible(false)} />
      
      <Text style={styles.title}>Bill Splitting</Text>
      <Text style={styles.subtitle}>Select items you want to pay for:</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={cartItems}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 150 }}
        />
      )}

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Amount to pay:</Text>
          <Text style={styles.totalAmount}>${calculateTotal()}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.payBtn, (selectedItems.length === 0 || paying) && styles.disabledBtn]}
          disabled={selectedItems.length === 0 || paying}
          onPress={handlePayment}
        >
          {paying ? <ActivityIndicator color="#000" /> : <Text style={styles.payBtnText}>PAY VIA STRIPE</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '900', textTransform: 'uppercase' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', marginBottom: 12 },
  paidItem: { opacity: 0.4, backgroundColor: '#E0E0E0' },
  itemName: { fontSize: 18, fontWeight: 'bold' },
  itemSub: { fontSize: 14, color: '#555', marginTop: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 3, borderColor: '#000', padding: 20, paddingBottom: 40 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalAmount: { fontSize: 24, fontWeight: '900' },
  payBtn: { backgroundColor: '#F1D1E5', borderWidth: 2, borderColor: '#000', padding: 20, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#ccc' },
  payBtnText: { fontWeight: '900', fontSize: 16 }
});