# Inventory Analytics Features

## Overview
The new **Inventory Analytics** component provides comprehensive inventory management insights with advanced filtering and visualization capabilities. It shows available units, highlights low-stock or overstocked items, and includes filtering by branch and product.

## Key Features

### 1. **Dual View Support**
- **Products View**: Displays product inventory with stock levels
- **Parts View**: Shows parts inventory with reorder thresholds

### 2. **Smart Stock Status Classification**
- **Out of Stock**: 0 units available (Critical risk)
- **Low Stock**: Below reorder threshold (High risk)
- **Normal**: Adequate stock levels (Low risk)
- **Overstocked**: Excessive inventory (Medium risk)

### 3. **Advanced Filtering**
- **Search**: Filter by item name or brand
- **Category/Brand Filter**: Filter by product category or brand
- **Branch Filter**: Filter by specific branch location
- **Product Type Toggle**: Switch between products and parts view

### 4. **Visual Analytics**

#### Stock Status Distribution (Pie Chart)
- Visual breakdown of inventory by status
- Color-coded: Red (Out of Stock), Yellow (Low Stock), Blue (Overstocked), Green (Normal)

#### Stock Levels Overview (Combined Chart)
- Bar chart showing current stock levels
- Line overlay indicating reorder points
- Helps identify items approaching reorder thresholds

#### Critical Stock Items Panel
- Lists items requiring immediate attention
- Sorted by urgency (lowest stock first)
- Quick access to high-risk inventory

### 5. **Summary Dashboard Cards**
- **Total Items**: Count of all inventory items
- **Out of Stock**: Items with zero inventory
- **Low Stock**: Items below reorder threshold
- **Overstocked**: Items with excessive inventory

### 6. **Detailed Inventory Table**
- Comprehensive item details
- Stock levels and reorder thresholds
- Risk level indicators
- Sortable and searchable

## Database Integration

The component integrates with your PocketBase collections:

### Products
- `products` collection for product information
- `product_stocks` collection for current stock levels
- Automatic stock status calculation

### Parts
- `parts` collection with built-in stock and reorder threshold fields
- `part_stock_log` collection for stock movement history
- Real-time status updates

### Branches
- `branch_details` collection for location-based filtering
- Enables multi-location inventory management

## Usage

### Accessing the Feature
1. Navigate to Analytics Dashboard
2. Click the "Inventory" tab in the view selector
3. Use filters to narrow down specific inventory views

### Best Practices
1. **Regular Monitoring**: Check critical stock items daily
2. **Filter Usage**: Use branch filters for location-specific management
3. **Reorder Alerts**: Pay attention to items in "High Risk" category
4. **Stock Optimization**: Monitor overstocked items to optimize inventory

## Technical Implementation

### Components Used
- **Recharts**: For responsive charts and visualizations
- **Shadcn/UI**: For modern, accessible UI components
- **React Hooks**: For state management and data processing
- **PocketBase**: For real-time data integration

### Performance Features
- **Memoized Calculations**: Efficient data processing
- **Responsive Design**: Works on all device sizes
- **Real-time Updates**: Reflects current inventory status
- **Optimized Rendering**: Displays first 50 items with pagination support

## Future Enhancements

Potential future additions:
- Stock movement history visualization
- Predictive restocking recommendations
- Integration with supplier management
- Automated reorder point calculations
- Export capabilities for reports
- Mobile app notifications for critical stock levels

## Screenshot Sections

The inventory analytics provides:
1. **Header with view selector** - Switch between overview, inventory, and services
2. **Filter controls** - Search, category, and branch filters
3. **Summary metrics** - Quick overview cards
4. **Visual charts** - Pie chart and bar chart with reorder line
5. **Critical items panel** - Priority items needing attention
6. **Detailed table** - Complete inventory listing with status badges
