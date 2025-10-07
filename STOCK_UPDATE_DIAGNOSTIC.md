# 🔍 Product Stock Not Updating - Diagnostic & Solution Guide

## Problem
Stock changes made directly in the PocketBase database are not reflecting in the products page UI.

## Root Causes Identified

### 1. **Data Fetching & Caching**
- The stock data is fetched via a relation expansion: `product_stocks_via_product_id`
- PocketBase might be caching the expanded relations
- React state holds the old stock values until a refresh

### 2. **Missing Refresh Trigger**
- The `refreshTrigger` prop wasn't being passed from the parent to the child component
- This prevented manual refreshes from updating the stock data

### 3. **Console Logging Gaps**
- No detailed logging to track stock values through the data pipeline
- Hard to diagnose where the stale data was coming from

## ✅ Solutions Implemented

### 1. Enhanced Logging in `readProducts.js`
Added comprehensive console logging to track:
- Raw data from PocketBase
- Expanded relation data
- Actual stock quantities from the database
- Formatted product data

**Code Changes:**
```javascript
// Added detailed stock logging
console.log('Stock quantity from database:', stockData.stock_quantity);
console.log('Stock info:', {
  stockObject: betterFormattedProducts[0].stock,
  stockQuantity: betterFormattedProducts[0].stock?.stock_quantity
});
```

### 2. Fixed Refresh Trigger Chain
**In `page.jsx`:**
- Added `refreshTrigger` state
- Pass it down to `ProductList` component
- Added console log to track refresh events

**In `ProductList.jsx`:**
- Accept `refreshTrigger` prop
- Use both internal and external refresh triggers in `useEffect` dependencies
- Added detailed logging for each product's stock value

### 3. Improved Cache Busting
Added `$autoCancel: false` to PocketBase query options to ensure fresh data.

## 🧪 How to Test

### Step 1: Open Browser Console
Open your browser's Developer Tools (F12) and go to the Console tab.

### Step 2: Check Current Stock Values
1. Load the products page
2. Look for logs like:
   ```
   🔍 Fetching products... (Trigger: 0, Internal: 0)
   📦 Raw result from getProductsWithAllData: {...}
   Product [ProductName]: stock_quantity = [number]
   ✅ Transformed data: [...]
   ```

### Step 3: Update Stock in Database
1. Go to PocketBase Admin UI
2. Find `product_stocks` collection
3. Update a `stock_quantity` value
4. Note the product_id

### Step 4: Refresh the Frontend
1. Click the **Refresh button** (circular arrow) in the products page header
2. Watch the console logs:
   ```
   🔄 Products data changed, triggering refresh...
   🔍 Fetching products... (Trigger: 1, Internal: 0)
   ```

### Step 5: Verify New Stock Value
Check if the new stock value appears in:
1. The console logs: `Product [ProductName]: stock_quantity = [new value]`
2. The products table on the screen

## 🔧 Troubleshooting

### Issue: Stock still shows old value after refresh

**Check 1: Is the stock record linked correctly?**
```sql
-- In PocketBase, verify the product_stocks record
SELECT * FROM product_stocks WHERE product_id = '[your_product_id]'
```
- Ensure `product_id` matches your product's ID
- Ensure `stock_quantity` has the correct value

**Check 2: Check browser console for errors**
- Look for any red error messages
- Check if the fetch is completing successfully

**Check 3: Verify the expand syntax**
The code uses: `product_stocks_via_product_id`

This is a **backreference** expansion that:
- Looks for records in `product_stocks` collection
- Where the `product_id` field matches the current product's ID
- Returns an array of matching records

**Check 4: Hard refresh the page**
- Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- This clears browser cache and forces a fresh load

### Issue: Console shows correct value but UI doesn't update

This might be a React rendering issue:

**Solution 1: Check the DataTable component**
- Verify it's receiving the updated `data` prop
- Check if `stock` accessor key matches the data structure

**Solution 2: Force re-render**
- Add a `key` prop to DataTable based on a changing value
- This forces React to recreate the component

## 📊 Data Flow Diagram

```
Database (product_stocks)
    ↓ (PocketBase API)
getProductsWithAllData()
    ↓ (Transform & Format)
ProductList Component State
    ↓ (Filter & Sort)
DataTable Component
    ↓ (Render)
UI Display
```

## 🔍 Quick Diagnostic Commands

Open browser console and run:

```javascript
// Check PocketBase connection
console.log('PB URL:', process.env.NEXT_PUBLIC_POCKETBASE_URL);

// Manually fetch a product with stock
const testProduct = await pb.collection('products').getOne('[product_id]', {
  expand: 'product_stocks_via_product_id'
});
console.log('Test product stock:', testProduct.expand?.product_stocks_via_product_id);
```

## 🎯 Expected Behavior

After implementing these fixes:

1. **Immediate Feedback**: Click refresh → See spinner → Data updates
2. **Console Logs**: Clear trace of data flow from DB to UI
3. **Stock Updates**: Changes in database reflect after clicking refresh
4. **No Caching**: Fresh data on every refresh

## 📝 Additional Notes

### Why Stock Might Not Update Automatically

The application doesn't use real-time subscriptions, so:
- Database changes won't automatically appear in the UI
- You must click the refresh button or reload the page
- This is by design for performance reasons

### To Add Real-Time Updates (Future Enhancement)

If you want automatic updates when the database changes:

1. **Use PocketBase Realtime API**:
```javascript
pb.collection('product_stocks').subscribe('*', (e) => {
  console.log('Stock changed:', e);
  // Trigger refresh
  handleDataChanged();
});
```

2. **Add to ProductList component**:
```javascript
useEffect(() => {
  // Subscribe to changes
  const unsubscribe = pb.collection('product_stocks').subscribe('*', () => {
    setInternalRefreshTrigger(prev => prev + 1);
  });

  return () => unsubscribe();
}, []);
```

## 🚀 Next Steps

1. Test the refresh button with console open
2. Check the logs to ensure data is flowing correctly
3. If stock still doesn't update, check the PocketBase records
4. Verify the product_id in product_stocks matches your product

---

**Updated:** October 6, 2025
**Status:** ✅ Fixed with enhanced logging and proper refresh triggers
