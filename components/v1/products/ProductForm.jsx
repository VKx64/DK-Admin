"use client";
import React, { useState, useEffect } from 'react';
import { useForm, Controller, FormState } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createProductWithAllData } from "@/services/pocketbase/createProducts";
import { updateProductWithAllData } from "@/services/pocketbase/updateProducts";

/**
 * ProductForm - A form component for creating or editing products using react-hook-form
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when dialog is closed
 * @param {Object} props.productData - Product data to edit (null for new product)
 * @param {Function} props.onSuccess - Function to call after successful submission
 */
const ProductForm = ({ isOpen, onClose, productData = null, onSuccess }) => {
  // State for tracking form submission and loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [hasWarranty, setHasWarranty] = useState(false);

  // Current active tab
  const [activeTab, setActiveTab] = useState("basic");

  // Initialize react-hook-form
  const { control, handleSubmit, setValue, watch, formState: { errors, isValid, dirtyFields } } = useForm({
    defaultValues: {
      // Basic product info
      product_name: "",
      product_model: "",
      brand: "",

      // Pricing info
      pricing: {
        base_price: 0,
        discount: 0,
        final_price: 0
      },

      // Product specifications
      specifications: {
        hp_capacity: "",
        refrigerant: "",
        compressorType: ""
      },

      // Stock info
      stock: {
        stock_quantity: 0
      },

      // Warranty info
      has_warranty: false,
      warranty: {
        coverage: "",
        duration: ""
      }
    },
    mode: "onChange" // This enables real-time validation
  });

  // Check if required fields are filled
  const product_name = watch("product_name");
  const product_model = watch("product_model");
  const brand = watch("brand");
  const isBasicInfoComplete = !!product_name && !!product_model && !!brand;

  // Handle tab change with validation
  const handleTabChange = (value) => {
    // Only allow changing from basic tab if all required fields are filled
    if (activeTab === "basic" && value !== "basic" && !isBasicInfoComplete) {
      // Show alert if trying to leave basic info tab without completing required fields
      alert("Please fill in all required fields in Basic Info tab before proceeding.");
      return;
    }

    // Otherwise, change to the selected tab
    setActiveTab(value);
  };

  // Watch for changes to calculate final price
  const basePrice = watch("pricing.base_price");
  const discount = watch("pricing.discount");

  // Calculate final price when base price or discount changes
  useEffect(() => {
    const calculatedFinalPrice = parseFloat(basePrice) * (1 - (parseFloat(discount) / 100));
    setValue("pricing.final_price", calculatedFinalPrice);
  }, [basePrice, discount, setValue]);

  // Initialize form data when editing a product
  useEffect(() => {
    if (productData) {
      // Basic product details
      setValue("product_name", productData.name || "");
      setValue("product_model", productData.model || "");
      setValue("brand", productData.brand || "");

      // Related data
      setValue("pricing.base_price", productData.basePrice || 0);
      setValue("pricing.discount", productData.discount || 0);
      setValue("pricing.final_price", productData.price || 0);

      setValue("specifications.hp_capacity", productData.specifications?.hp_capacity || "");
      setValue("specifications.refrigerant", productData.specifications?.refrigerant || "");
      setValue("specifications.compressorType", productData.specifications?.compressorType || "");

      setValue("stock.stock_quantity", productData.stock || 0);

      // Handle warranty data
      const hasWarrantyData = !!(productData.warranty?.coverage || productData.warranty?.duration);
      setHasWarranty(hasWarrantyData);
      setValue("has_warranty", hasWarrantyData);

      if (hasWarrantyData) {
        setValue("warranty.coverage", productData.warranty?.coverage || "");
        setValue("warranty.duration", productData.warranty?.duration || "");
      }

      // Set image preview if exists
      if (productData.image && productData.image !== "/Images/default_user.jpg") {
        setImagePreview(productData.image);
      }
    }
  }, [productData, setValue]);

  // Handle warranty checkbox change
  const handleWarrantyToggle = (checked) => {
    setHasWarranty(checked);
    setValue("has_warranty", checked);

    if (!checked) {
      // Clear warranty fields when unchecked
      setValue("warranty.coverage", "");
      setValue("warranty.duration", "");
    }
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission handler
  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Create a FormData object for file upload
      const productFormData = new FormData();

      // Add basic product info
      productFormData.append("product_name", data.product_name);
      productFormData.append("product_model", data.product_model);
      productFormData.append("brand", data.brand);

      // Add image if selected
      if (selectedImage) {
        productFormData.append("image", selectedImage);
      }

      // Data object for all related data (pricing, specs, stock, warranty)
      const relatedData = {
        pricing: {
          base_price: parseFloat(data.pricing.base_price),
          discount: parseFloat(data.pricing.discount),
          final_price: parseFloat(data.pricing.final_price)
        },
        specifications: {
          hp_capacity: data.specifications.hp_capacity,
          refrigerant: data.specifications.refrigerant,
          compressorType: data.specifications.compressorType
        },
        stock: {
          stock_quantity: parseInt(data.stock.stock_quantity)
        },
        warranty: data.has_warranty ? {
          coverage: data.warranty.coverage,
          duration: data.warranty.duration
        } : null
      };

      let result;
      // If editing, update the product; otherwise create a new one
      if (productData) {
        // For updates, we need to extract the basic product data for the API
        const productBasicData = {
          product_name: data.product_name,
          product_model: data.product_model,
          brand: data.brand
        };

        // If we have a new image, use FormData, otherwise use the plain object
        const updateData = selectedImage ? productFormData : productBasicData;

        // For updates, we send ID and use updateProductWithAllData
        result = await updateProductWithAllData(
          productData.id,
          updateData,
          relatedData
        );
      } else {
        // For new products, use createProductWithAllData
        result = await createProductWithAllData(
          productFormData,
          relatedData
        );
      }

      if (result.success) {
        // Call onSuccess callback with the result
        if (onSuccess) {
          onSuccess(result.data);
        }

        // Close the dialog
        onClose();
      } else {
        // Handle error
        console.error("Error saving product:", result.message);
        alert(`Failed to save product: ${result.message}`);
      }
    } catch (error) {
      console.error("Error submitting product form:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch has_warranty value
  const watchHasWarranty = watch("has_warranty");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{productData ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger
                value="pricing"
                disabled={!isBasicInfoComplete}
                className={!isBasicInfoComplete ? "opacity-50 cursor-not-allowed" : ""}
              >Pricing</TabsTrigger>
              <TabsTrigger
                value="specifications"
                disabled={!isBasicInfoComplete}
                className={!isBasicInfoComplete ? "opacity-50 cursor-not-allowed" : ""}
              >Specifications</TabsTrigger>
              <TabsTrigger
                value="stock"
                disabled={!isBasicInfoComplete}
                className={!isBasicInfoComplete ? "opacity-50 cursor-not-allowed" : ""}
              >Stock</TabsTrigger>
              <TabsTrigger
                value="warranty"
                disabled={!isBasicInfoComplete}
                className={!isBasicInfoComplete ? "opacity-50 cursor-not-allowed" : ""}
              >Warranty</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Controller
                    name="product_name"
                    control={control}
                    rules={{ required: "Product name is required" }}
                    render={({ field }) => (
                      <Input
                        id="product_name"
                        placeholder="Enter product name"
                        {...field}
                        className={errors.product_name ? "border-red-500" : ""}
                      />
                    )}
                  />
                  {errors.product_name && (
                    <p className="text-red-500 text-xs">{errors.product_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_model">Model Number *</Label>
                  <Controller
                    name="product_model"
                    control={control}
                    rules={{ required: "Model number is required" }}
                    render={({ field }) => (
                      <Input
                        id="product_model"
                        placeholder="Enter model number"
                        {...field}
                        className={errors.product_model ? "border-red-500" : ""}
                      />
                    )}
                  />
                  {errors.product_model && (
                    <p className="text-red-500 text-xs">{errors.product_model.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Controller
                  name="brand"
                  control={control}
                  rules={{ required: "Brand is required" }}
                  render={({ field }) => (
                    <Input
                      id="brand"
                      placeholder="Enter brand name"
                      {...field}
                      className={errors.brand ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.brand && (
                  <p className="text-red-500 text-xs">{errors.brand.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="h-32 w-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Base Price</Label>
                  <Controller
                    name="pricing.base_price"
                    control={control}
                    rules={{
                      required: "Base price is required",
                      min: { value: 0, message: "Price cannot be negative" }
                    }}
                    render={({ field }) => (
                      <Input
                        id="base_price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        className={errors.pricing?.base_price ? "border-red-500" : ""}
                      />
                    )}
                  />
                  {errors.pricing?.base_price && (
                    <p className="text-red-500 text-xs">{errors.pricing.base_price.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Controller
                    name="pricing.discount"
                    control={control}
                    rules={{
                      min: { value: 0, message: "Discount cannot be negative" },
                      max: { value: 100, message: "Discount cannot exceed 100%" }
                    }}
                    render={({ field }) => (
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        {...field}
                        className={errors.pricing?.discount ? "border-red-500" : ""}
                      />
                    )}
                  />
                  {errors.pricing?.discount && (
                    <p className="text-red-500 text-xs">{errors.pricing.discount.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="final_price">Final Price</Label>
                <Controller
                  name="pricing.final_price"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="final_price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      readOnly
                      className="bg-gray-50"
                    />
                  )}
                />
                <p className="text-xs text-gray-500">
                  Final price is calculated automatically based on base price and discount.
                </p>
              </div>
            </TabsContent>

            {/* Specifications Tab */}
            <TabsContent value="specifications" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hp_capacity">HP Capacity</Label>
                  <Controller
                    name="specifications.hp_capacity"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="hp_capacity"
                        placeholder="E.g. 1.5 HP"
                        {...field}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refrigerant">Refrigerant</Label>
                  <Controller
                    name="specifications.refrigerant"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="refrigerant"
                        placeholder="E.g. R410A"
                        {...field}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="compressorType">Compressor Type</Label>
                <Controller
                  name="specifications.compressorType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="compressorType"
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select compressor type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inverter">Inverter</SelectItem>
                        <SelectItem value="Non-Inverter">Non-Inverter</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </TabsContent>

            {/* Stock Tab */}
            <TabsContent value="stock" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Controller
                  name="stock.stock_quantity"
                  control={control}
                  rules={{
                    min: { value: 0, message: "Stock cannot be negative" }
                  }}
                  render={({ field }) => (
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...field}
                      className={errors.stock?.stock_quantity ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.stock?.stock_quantity && (
                  <p className="text-red-500 text-xs">{errors.stock.stock_quantity.message}</p>
                )}
              </div>
            </TabsContent>

            {/* Warranty Tab */}
            <TabsContent value="warranty" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="has_warranty" checked={watchHasWarranty} onCheckedChange={handleWarrantyToggle} />
                <Label htmlFor="has_warranty">This product has a warranty</Label>
              </div>

              {hasWarranty && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="coverage">Warranty Coverage</Label>
                    <Controller
                      name="warranty.coverage"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="coverage"
                          placeholder="E.g. Parts and Labor"
                          {...field}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Warranty Duration</Label>
                    <Controller
                      name="warranty.duration"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="duration"
                          placeholder="E.g. 1 Year"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            {/* Navigation buttons */}
            <div className="mr-auto flex gap-2">
              {/* Only show Previous button when creating a new product (not when editing) */}
              {activeTab !== "basic" && !productData && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ["basic", "pricing", "specifications", "stock", "warranty"];
                    const currentIndex = tabs.indexOf(activeTab);
                    setActiveTab(tabs[currentIndex - 1]);
                  }}
                >
                  Previous
                </Button>
              )}
              {/* Only show Next button when creating a new product (not when editing) */}
              {activeTab !== "warranty" && !productData && (
                <Button
                  type="button"
                  onClick={() => {
                    const tabs = ["basic", "pricing", "specifications", "stock", "warranty"];
                    const currentIndex = tabs.indexOf(activeTab);
                    setActiveTab(tabs[currentIndex + 1]);
                  }}
                >
                  Next
                </Button>
              )}
            </div>

            {/* Form action buttons */}
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (activeTab === "basic" && !isBasicInfoComplete)}
            >
              {isSubmitting ? "Saving..." : (productData ? "Update Product" : "Create Product")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;