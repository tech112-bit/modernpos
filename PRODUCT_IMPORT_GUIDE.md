# Product Import Guide

## 📋 **CSV Import Templates**

This guide explains how to import products and categories using the provided CSV templates.

## 📁 **Files Included**

1. **`categories-import-template.csv`** - Template for importing categories
2. **`product-import-template.csv`** - Template for importing products

## 🚀 **Step-by-Step Import Process**

### **Step 1: Import Categories First**

1. **Open the categories template:**
   - Use `categories-import-template.csv`
   - Categories must be imported before products

2. **Required fields:**
   - `name` - Category name (required)
   - `description` - Category description (optional)

3. **Import categories:**
   - Go to `/dashboard/categories/import`
   - Upload the categories CSV file
   - Verify all categories are created successfully

### **Step 2: Import Products**

1. **Prepare your product data:**
   - Use `product-import-template.csv` as a template
   - Replace sample data with your actual products

2. **Required fields:**
   - `name` - Product name (required)
   - `sku` - Stock Keeping Unit (required, must be unique per user)
   - `price` - Selling price (required, decimal)
   - `cost` - Product cost (required, decimal)
   - `stock` - Initial stock quantity (required, integer)
   - `category_id` - Category ID from step 1 (required)

3. **Optional fields:**
   - `description` - Product description
   - `barcode` - Product barcode

### **Step 3: Update Category IDs**

1. **Get category IDs:**
   - After importing categories, note the generated IDs
   - Update the `category_id` column in your products CSV

2. **Example category IDs:**
   ```
   Electronics → cat_1703123456789_abc123def
   Smartphones → cat_1703123456790_def456ghi
   Laptops → cat_1703123456791_ghi789jkl
   ```

## 📊 **CSV Format Requirements**

### **Data Types:**
- **Text fields:** Use quotes for values with commas or special characters
- **Numbers:** Use decimal points (e.g., 1299.99)
- **Integers:** Whole numbers only (e.g., 50)
- **IDs:** Must match existing category IDs exactly

### **Special Characters:**
- **Commas in text:** Wrap in quotes: `"Product, with comma"`
- **Quotes in text:** Escape with double quotes: `"Product ""quoted"" text"`
- **New lines:** Not supported in CSV format

## ⚠️ **Important Notes**

### **Before Import:**
1. **Backup your data** if importing to existing system
2. **Test with small sample** first
3. **Verify category IDs** are correct
4. **Check SKU uniqueness** within your user account

### **During Import:**
1. **Monitor progress** and any error messages
2. **Verify stock quantities** are correct
3. **Check price formatting** (decimal points, not commas)

### **After Import:**
1. **Verify products** appear in your inventory
2. **Check stock levels** are correct
3. **Test product creation** of new sales
4. **Verify category associations** are working

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Category not found" error:**
   - Ensure categories are imported first
   - Verify category_id matches exactly

2. **"SKU already exists" error:**
   - Check for duplicate SKUs in your CSV
   - Verify SKU is unique within your user account

3. **"Invalid price format" error:**
   - Use decimal points (1299.99), not commas (1.299,99)
   - Ensure price and cost are numeric

4. **"Stock must be positive" error:**
   - Ensure stock values are whole numbers ≥ 0

## 📝 **Sample Data Structure**

```csv
name,description,sku,barcode,price,cost,stock,category_id
"Product Name","Product description here","SKU123","1234567890123",99.99,59.99,100,"cat_1703123456789_abc123def"
```

## 🎯 **Best Practices**

1. **Start small:** Import 5-10 products first to test
2. **Validate data:** Check all required fields are filled
3. **Use consistent formatting:** Maintain consistent SKU patterns
4. **Backup regularly:** Keep backups of your import files
5. **Test functionality:** Verify products work in sales after import

## 📞 **Support**

If you encounter issues during import:
1. Check the error messages carefully
2. Verify your CSV format matches the template
3. Ensure all required fields are populated
4. Check that category IDs are valid

---

**Happy importing! 🚀**
