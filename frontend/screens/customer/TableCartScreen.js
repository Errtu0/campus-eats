import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import Checkbox from 'expo-checkbox';
import { useStripe } from '@stripe/stripe-react-native'; 
import { ORDER_URL, PAYMENT_URL, ADMIN_URL } from '../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../src/styles/theme'; // Added theme
import CustomAlert from '../../components/CustomAlert';

export default function TableCartScreen({ route, navigation }) {
 const { session, user } = route.params;
 const { initPaymentSheet, presentPaymentSheet } = useStripe();
 
 const [cartItems, setCartItems] = useState([]);
 const [selectedItems, setSelectedItems] = useState([]); 
 const [loading, setLoading] = useState(true);
 const [paying, setPaying] = useState(false);

  // NEW: Coupon Logic States
  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [verifyingPromo, setVerifyingPromo] = useState(false);

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

  // NEW: Coupon Verification Logic
const handleVerifyCoupon = async () => {
    if (!promoCode) return;
    
    // DEBUG: Add this to see what is inside session on your phone
    console.log("Session object in Cart:", session);

    // Use a fallback to find the ID regardless of naming convention
    const rId = session.restaurant_id || session.restaurantId || session.id;

    if (!rId) {
        return showAlert("Error", "Restaurant information is missing.");
    }

    setVerifyingPromo(true);
    try {
      const res = await fetch(`${ADMIN_URL}/coupons/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            code: promoCode.trim(), 
            restaurantId: rId // Using the fallback variable
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAppliedCoupon(data);
        showAlert("Success", `${data.discount_value}% discount applied!`);
      } else {
        showAlert("Invalid Code", data.error || "Promo code not found.");
        setAppliedCoupon(null);
      }
    } catch (e) {
      showAlert("Error", "Network error: " + e.message);
    } finally {
      setVerifyingPromo(false);
    }
};

 const toggleItemSelection = (itemId) => {
  setSelectedItems(prev => 
   prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
  );
 };

 const calculateTotal = () => {
  const subtotal = cartItems
   .filter(item => selectedItems.includes(item.id))
   .reduce((sum, item) => sum + item.item.price, 0);
    
    if (appliedCoupon) {
      const discount = subtotal * (appliedCoupon.discount_value / 100);
      return (subtotal - discount).toFixed(2);
    }
  return subtotal.toFixed(2);
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
      setAppliedCoupon(null); // Reset after payment
      setPromoCode('');
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
    paymentMethod: 'STRIPE_CARD',
        couponId: appliedCoupon?.id || null // Pass Coupon ID to backend
   }),
  });

  const result = await response.json();
  
  if (!response.ok) {
   console.error("Logic Error:", result.error);
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
          color={isSelected ? COLORS.primary : '#000'}
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
     contentContainerStyle={{ paddingBottom: 250 }} // Increased for promo box
     showsVerticalScrollIndicator={false}
    />
   )}

   <View style={styles.footer}>
      {!appliedCoupon ? (
        <View style={styles.promoContainer}>
          <TextInput
            style={styles.promoInput}
            placeholder="Promo Code"
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.applyBtn} onPress={handleVerifyCoupon}>
            {verifyingPromo ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.applyText}>APPLY</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.appliedBadge}>
          <Text style={styles.appliedText}>
            PROMO: {appliedCoupon.code} (-{appliedCoupon.discount_value}%)
          </Text>
          <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
            <Text style={{ fontWeight: '900', color: '#000' }}>[X]</Text>
          </TouchableOpacity>
        </View>
      )}
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
  promoContainer: { flexDirection: 'row', marginBottom: 12, gap: 10 },
  promoInput: { flex: 1, borderWidth: 2, borderColor: '#000', padding: 10, fontWeight: '700', backgroundColor: '#fff' },
  applyBtn: { backgroundColor: '#000', paddingHorizontal: 20, justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  applyText: { color: '#fff', fontWeight: '900' },
  appliedBadge: { backgroundColor: COLORS.primary, padding: 10, borderWidth: 2, borderColor: '#000', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  appliedText: { color: '#fff', fontWeight: '900', fontSize: 12 },
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
  backgroundColor: COLORS.primary, 
  borderWidth: 2, 
  borderColor: COLORS.black, 
  padding: 20, 
  alignItems: 'center',
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