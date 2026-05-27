import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Image } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native'; 
import { ORDER_URL, PAYMENT_URL, ADMIN_URL } from '../../src/config';
import { COLORS } from '../../src/styles/theme'; 
import CustomAlert from '../../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, Ticket, Plus, Minus } from 'lucide-react-native';

const itemImages = {
  'Signature Latte': require('../../assets/latte.png'),
  'Classic Burger': require('../../assets/burger.png'),
  'Mocha': require('../../assets/mocha.png'),
  'Matcha Latte': require('../../assets/matcha.png'),
  'BBQ Burger': require('../../assets/burger.png'),
  'Rodeo Burger': require('../../assets/rodeo_burger.png'),
  'Loaded Fries': require('../../assets/fries.png'),
  'Lemonade': require('../../assets/lemonade.png'),
  'Coca Cola': require('../../assets/cola.png'),
  'Smash Burger': require('../../assets/smash_burger.png'),
  'Water': require('../../assets/water.png'),
  'default': require('../../assets/latte.png'),
};

export default function TableCartScreen({ route, navigation }) {
  const { session, user } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const [cartItems, setCartItems] = useState([]);
  
  // FIX 1: SHARED SPLIT TRACKER OBJECT SYSTEM (Key: cartItemId -> Value: quantity to pay for)
  const [selectedSplits, setSelectedSplits] = useState({}); 
  
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

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
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${ORDER_URL}/session-cart/${session.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setCartItems(data);
        
        // Auto-initialize split tracker state map cleanly
        const initialSplits = {};
        data.forEach(item => {
          if (!item.paid_by_user_id) {
            initialSplits[item.id] = 0; // Starts at zero items selected to pay
          }
        });
        setSelectedSplits(initialSplits);
      } else {
        setCartItems([]);
      }
    } catch (e) {
      showAlert("ERROR", "Could not load table cart.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCoupon = async () => {
    if (!promoCode) return;
    const rId = session.restaurant_id || session.restaurantId;
    if (!rId) return showAlert("ERROR", "Restaurant information missing.");

    setVerifyingPromo(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/coupons/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          code: promoCode.trim().toUpperCase(), 
          restaurantId: parseInt(rId) 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAppliedCoupon(data);
        showAlert("SUCCESS", `${data.discount_value}% DISCOUNT LOCKED IN!`);
      } else {
        showAlert("INVALID CODE", data.error || "Promo code not found.");
        setAppliedCoupon(null);
      }
    } catch (e) {
      showAlert("ERROR", "Network error: " + e.message);
    } finally {
      setVerifyingPromo(false);
    }
  };

  // FIX 2: STEPPER INCREMENT/DECREMENT MODIFIER PATHS FOR INDIVIDUAL CART ROW CODES
  const incrementSplit = (itemId, maxQty) => {
    setSelectedSplits(prev => {
      const currentVal = prev[itemId] || 0;
      if (currentVal < maxQty) {
        return { ...prev, [itemId]: currentVal + 1 };
      }
      return prev;
    });
  };

  const decrementSplit = (itemId) => {
    setSelectedSplits(prev => {
      const currentVal = prev[itemId] || 0;
      if (currentVal > 0) {
        return { ...prev, [itemId]: currentVal - 1 };
      }
      return prev;
    });
  };

  const calculateTotal = () => {
    let subtotal = 0;
    cartItems.forEach(item => {
      const selectedQty = selectedSplits[item.id] || 0;
      // Multiply specified partial unit count directly by base asset price metrics
      subtotal += (item.item.price * selectedQty);
    });
      
    if (appliedCoupon) {
      const discountVal = appliedCoupon.discount_value;
      const discount = subtotal * (discountVal / 100);
      return (subtotal - discount).toFixed(2);
    }
    return subtotal.toFixed(2);
  };

  const hasSelectedItems = () => {
    return Object.values(selectedSplits).some(qty => qty > 0);
  };

const handlePayment = async () => {
    const amount = calculateTotal();
    if (parseFloat(amount) <= 0 || !hasSelectedItems()) return;
    if (cartItems.length === 0) return showAlert("ERROR", "No items to pay for.");
    
    const orderId = cartItems[0].order_id; 

    setPaying(true);
    try {
      const token = await AsyncStorage.getItem('userToken');

      
      const flattenedItemIds = [];
        Object.keys(selectedSplits).forEach(itemId => {
          const qtyToPay = selectedSplits[itemId] || 0;
          for (let i = 0; i < qtyToPay; i++) {
            flattenedItemIds.push(parseInt(itemId));
          }
        });

      const response = await fetch(`${PAYMENT_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          // Re-aligned perfectly with backend expectations!
          selectedItemIds: flattenedItemIds, 
          couponId: appliedCoupon?.id || null 
        }),
      });
      const data = await response.json();
      
      if (!data.clientSecret) throw new Error(data.error || "Could not generate payment intent.");

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: 'CampusEats',
        returnURL: 'campuseats://stripe-redirect',
        style: 'alwaysDark'
      });

      if (initError) throw new Error(initError.message);
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        showAlert("PAYMENT CANCELED", paymentError.message);
      } else {
        // Apply the exact same structural adjustment to your database confirmation call below
        await confirmPaymentInDB(orderId, flattenedItemIds); 
        showAlert("SUCCESS", "Payment successful! Your points have updated.");
        setAppliedCoupon(null); 
        setPromoCode('');
        fetchTableCart();
      }
    } catch (e) {
      showAlert("PAYMENT ERROR", e.message);
    } finally {
      setPaying(false);
    }
  };

const confirmPaymentInDB = async (orderId, flattenedItemIds) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${PAYMENT_URL}/confirm-payment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          orderId: orderId,
          selectedItemIds: flattenedItemIds, // Passes the matching array safely
          couponId: appliedCoupon?.id || null
        }),
      });
    } catch (error) {
      console.error("Network stock processing sync error:", error.message);
    }
  };

  const renderItem = ({ item }) => {
    const isPaid = !!item.paid_by_user_id;
    // Fallback securely to quantity property defaulting safely to 1 if unassigned
    const totalQuantityAvailable = item.quantity || 1;
    const currentlySelectedShare = selectedSplits[item.id] || 0;
    const imgSource = itemImages[item.item.name] || itemImages['default'];
    
    return (
      <View style={[styles.itemRow, isPaid && styles.paidItem]}>
        <Image source={imgSource} style={styles.cartThumbnail} />
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>
            {item.item.name.toUpperCase()} {totalQuantityAvailable > 1 && `(X${totalQuantityAvailable})`}
          </Text>
          
          {!!item.customization && (
            <Text style={styles.customizationNotesText}>
              PREF: {item.customization.toUpperCase()}
            </Text>
          )}

          <Text style={styles.itemSub}>
            {isPaid ? `PAID BY ${item.paid_by?.username?.toUpperCase() || 'STUDENT'}` : `$${item.item.price.toFixed(2)} each`}
          </Text>
        </View>

        {/* FIX 4: INTERACTIVE STEPPER SPLITTER RENDER LOGIC FOR UNPAID SYSTEM ROWS */}
        {!isPaid && (
          <View style={styles.cartStepperContainerRow}>
            <TouchableOpacity 
              style={[styles.stepperBtn, currentlySelectedShare === 0 && styles.disabledStepperBtn]} 
              onPress={() => decrementSplit(item.id)}
              disabled={currentlySelectedShare === 0}
            >
              <Minus size={12} color="#000" strokeWidth={3} />
            </TouchableOpacity>
            
            <View style={[styles.stepperValueBox, currentlySelectedShare > 0 && styles.activeValueBox]}>
              <Text style={styles.stepperValueText}>{currentlySelectedShare}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.stepperBtn, currentlySelectedShare === totalQuantityAvailable && styles.disabledStepperBtn]} 
              onPress={() => incrementSplit(item.id, totalQuantityAvailable)}
              disabled={currentlySelectedShare === totalQuantityAvailable}
            >
              <Plus size={12} color="#000" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertVisible(false)} />
      
      <Text style={styles.title}>BILL SPLITTING</Text>
      <Text style={styles.subtitle}>CHOOSE HOW MANY UNITS YOU WANT TO PAY FOR:</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={cartItems}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 260 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>TABLE CART IS EMPTY</Text>
            </View>
          }
        />
      )}

      {/* FOOTER */}
      <View style={styles.footer}>
        {!appliedCoupon ? (
          <View style={styles.promoContainer}>
            <TextInput
              style={styles.promoInput}
              placeholder="PROMO CODE"
              placeholderTextColor="#999"
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ticket size={16} color="#fff" />
              <Text style={styles.appliedText}>
                PROMO: {appliedCoupon.code} (-{appliedCoupon.discount_value}%)
              </Text>
            </View>
            <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
              <X size={18} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>YOUR SELECTED ORDERS:</Text>
          <Text style={styles.totalAmount}>${calculateTotal()}</Text>
        </View>
        
        <View style={styles.btnWrapper}>
          <TouchableOpacity 
            style={[styles.payBtn, (!hasSelectedItems() || paying) && styles.disabledBtn]}
            disabled={!hasSelectedItems() || paying}
            onPress={handlePayment}
            activeOpacity={0.9}
          >
            {paying ? <ActivityIndicator color="#000" /> : <Text style={styles.payBtnText}>PAY VIA STRIPE</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 20, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, color: '#000' },
  subtitle: { fontSize: 11, color: '#666', fontWeight: '800', marginBottom: 20, textTransform: 'uppercase' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 4 },
  paidItem: { opacity: 0.4, backgroundColor: '#EAEAEA', shadowOffset: { width: 0, height: 0 }, elevation: 0, borderColor: '#888' },
  cartThumbnail: { width: 44, height: 44, borderWidth: 2, borderColor: '#000', marginRight: 12, resizeMode: 'contain', backgroundColor: '#F8F8F8' },
  customizationNotesText: { fontSize: 10, fontWeight: '800', color: 'red', marginTop: 2, letterSpacing: -0.2 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '900', color: '#000' },
  itemSub: { fontSize: 11, color: '#555', fontWeight: '800', marginTop: 2 },
  
  // FIX 5: ADJUSTED FOOTPRINT STEPPER SYSTEM SHEET SPECIFICATIONS FOR BILL SPLITTING ROWS
  cartStepperContainerRow: { flexDirection: 'row', alignItems: 'center', height: 36, width: 100, borderWidth: 2.5, borderColor: '#000', backgroundColor: '#fff' },
  stepperBtn: { width: 30, height: '100%', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  disabledStepperBtn: { opacity: 0.2 },
  stepperValueBox: { flex: 1, height: '100%', backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderLeftWidth: 2.5, borderRightWidth: 2.5, borderColor: '#000' },
  activeValueBox: { backgroundColor: '#7befb1' }, // Lights up green when items are added to your share!
  stepperValueText: { fontSize: 13, fontWeight: '900', color: '#000' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 4, borderColor: '#000', padding: 20, paddingBottom: 35 },
  promoContainer: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  promoInput: { flex: 1, borderWidth: 3, borderColor: '#000', padding: 12, fontWeight: '900', fontSize: 14, backgroundColor: '#fff' },
  applyBtn: { backgroundColor: '#000', paddingHorizontal: 22, justifyContent: 'center', borderWidth: 3, borderColor: '#000' },
  applyText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  appliedBadge: { backgroundColor: '#00C851', padding: 14, borderWidth: 3, borderColor: '#000', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  appliedText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 14, fontWeight: '900', color: '#000' },
  totalAmount: { fontSize: 28, fontWeight: '900', color: '#000', letterSpacing: -0.5 },
  btnWrapper: { backgroundColor: '#000', borderWidth: 1, borderColor: '#000' },
  payBtn: { backgroundColor: COLORS.primary, borderWidth: 3, borderColor: '#000', padding: 18, alignItems: 'center', transform: [{ translateX: -4 }, { translateY: -4 }] },
  disabledBtn: { backgroundColor: '#ddd', transform: [{ translateX: 0 }, { translateY: 0 }] },
  payBtnText: { fontWeight: '900', fontSize: 14, color: '#000', letterSpacing: 0.5 },
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontWeight: '900', color: '#ccc', fontSize: 14 }
});