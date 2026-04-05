import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Checkbox from 'expo-checkbox';
import { useStripe } from '@stripe/stripe-react-native'; 
import { ORDER_URL, PAYMENT_URL } from '../src/config';
import { COLORS, GLOBAL_STYLES } from '../src/styles/theme'; // Added theme
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

    // FIX: Get the orderId from the first item in the cart
    if (cartItems.length === 0) return showAlert("Error", "No items to pay for.");
    const orderId = cartItems[0].order_id; 

    setPaying(true);
    try {
      // 1. Request Payment Intent
      const response = await fetch(`${PAYMENT_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      const data = await response.json();
      
      if (!data.clientSecret) throw new Error("Could not get payment secret from server");

      // 2. Initialize Stripe
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: 'CampusEats',
        returnURL: 'campuseats://stripe-redirect',
      });

      if (initError) throw new Error(initError.message);

      // 3. Present Stripe Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
      showAlert("Payment Canceled", paymentError.message);
    } else {
      // 1. Trigger the backend logic
      await confirmPaymentInDB(orderId, user.id, selectedItems); 
  
      showAlert("Success", "Payment successful!");
      fetchTableCart();
    }
    } catch (e) {
      showAlert("Payment Error", e.message);
    } finally {
      setPaying(false);
    }
  };

// 5. Helper function to hit your NEW /confirm-payment route
const confirmPaymentInDB = async (orderId) => {
  try {
    const response = await fetch(`${PAYMENT_URL}/confirm-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderId: orderId,
        userId: user.id,
        selectedItemIds: selectedItems,
        paymentMethod: 'STRIPE_CARD' 
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("Logic Error:", result.error);
      // We don't block the user here because the money is already gone
    } else {
      console.log("✅ Stock Deduction Successful:", result.message);
    }
  } catch (error) {
    console.error("Network Error during stock deduction:", error.message);
  }
};

  const renderItem = ({ item }) => {
    const isPaid = !!item.paid_by_user_id;
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <View style={[styles.itemRow, isPaid && styles.paidItem]}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.item.name}</Text>
          <Text style={styles.itemSub}>
            {isPaid ? `Paid by ${item.paid_by?.username || 'user'}` : `$${item.item.price.toFixed(2)}`}
          </Text>
        </View>
        {!isPaid && (
          <Checkbox
            style={styles.checkbox}
            value={isSelected}
            onValueChange={() => toggleItemSelection(item.id)}
            color={isSelected ? COLORS.primary : COLORS.black}
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
        <ActivityIndicator size="large" color={COLORS.secondary} style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={cartItems}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 180 }}
          showsVerticalScrollIndicator={false}
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
          {paying ? <ActivityIndicator color={COLORS.black} /> : <Text style={styles.payBtnText}>PAY VIA STRIPE</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FDFBEB', 
    padding: 20, 
    paddingTop: 60 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '900', 
    textTransform: 'uppercase',
    color: COLORS.black 
  },
  subtitle: { 
    fontSize: 14, 
    color: COLORS.gray, 
    fontWeight: '600',
    marginBottom: 20 
  },
  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: COLORS.white, 
    borderWidth: 2, 
    borderColor: COLORS.black, 
    marginBottom: 12,
    // Neobrutalist Shadow
    shadowColor: COLORS.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },
  paidItem: { 
    opacity: 0.5, 
    backgroundColor: '#E0E0E0',
    shadowOffset: { width: 0, height: 0 },
    elevation: 0
  },
  itemInfo: { flex: 1 },
  itemName: { 
    fontSize: 18, 
    fontWeight: '900',
    color: COLORS.black 
  },
  itemSub: { 
    fontSize: 14, 
    color: COLORS.gray, 
    fontWeight: '700',
    marginTop: 4 
  },
  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: COLORS.white, 
    borderTopWidth: 3, 
    borderColor: COLORS.black, 
    padding: 20, 
    paddingBottom: 40 
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 15 
  },
  totalLabel: { 
    fontSize: 18, 
    fontWeight: '900',
    color: COLORS.black 
  },
  totalAmount: { 
    fontSize: 26, 
    fontWeight: '900',
    color: COLORS.black 
  },
  payBtn: { 
    backgroundColor: COLORS.primary, // Using the Pink color
    borderWidth: 2, 
    borderColor: COLORS.black, 
    padding: 20, 
    alignItems: 'center',
    // Button Shadow
    shadowColor: COLORS.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5
  },
  disabledBtn: { 
    backgroundColor: '#ccc',
    shadowOffset: { width: 0, height: 0 },
    elevation: 0
  },
  payBtnText: { 
    fontWeight: '900', 
    fontSize: 16,
    color: COLORS.black,
    letterSpacing: 1
  }
});