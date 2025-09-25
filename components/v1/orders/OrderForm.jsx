"use client";
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/services/pocketbase/createOrders";
import { getProductsWithAllData } from "@/services/pocketbase/readProducts";
import pb from "@/services/pocketbase";

/**
 * OrderForm - A form component for creating new orders
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when dialog is closed
 * @param {Function} props.onSuccess - Function to call after successful submission
 */
const OrderForm = ({ isOpen, onClose, onSuccess }) => {
  // State for tracking form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("customer");

  // State for customer selection
  const [customers, setCustomers] = useState([]);

  // State for product selection
  const [products, setProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // State for address handling
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // PSGC API states for location dropdown
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState({
    regions: false,
    provinces: false,
    cities: false,
    barangays: false
  });

  // Initialize react-hook-form
  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      // Customer info
      customer_type: "existing", // "existing" or "new"
      user: "", // for existing customers
      customer_name: "", // for new customers

      // Order details
      status: "Pending",
      products: [],
      mode_of_payment: "Cash On Delivery",

      // Delivery info
      address: "",
      delivery_fee: 0,

      // New address form
      new_address: {
        name: "",
        phone: "",
        street_address: "",
        region: "",
        province: "",
        city: "",
        barangay: "",
        zip_code: "",
        additional_notes: ""
      }
    },
    mode: "onChange"
  });

  // Watch form values
  const userValue = watch("user");
  const customerTypeValue = watch("customer_type");
  const customerName = watch("customer_name");
  const paymentMethod = watch("mode_of_payment");
  const selectedAddress = watch("address");
  const selectedRegion = watch("new_address.region");
  const selectedProvince = watch("new_address.province");
  const selectedCity = watch("new_address.city");

  // Fetch regions from PSGC API
  const fetchRegions = async () => {
    try {
      setLoading(prev => ({ ...prev, regions: true }));
      const response = await fetch('https://psgc.cloud/api/regions');
      const data = await response.json();
      setRegions(data);
    } catch (error) {
      console.error("Error fetching regions:", error);
    } finally {
      setLoading(prev => ({ ...prev, regions: false }));
    }
  };

  // Fetch provinces by region
  const fetchProvinces = async (regionCode) => {
    if (!regionCode) {
      setProvinces([]);
      return;
    }

    try {
      setLoading(prev => ({ ...prev, provinces: true }));
      const response = await fetch(`https://psgc.cloud/api/regions/${regionCode}/provinces`);
      const data = await response.json();
      setProvinces(data);
    } catch (error) {
      console.error("Error fetching provinces:", error);
    } finally {
      setLoading(prev => ({ ...prev, provinces: false }));
    }
  };

  // Fetch cities/municipalities by province
  const fetchCities = async (provinceCode) => {
    if (!provinceCode) {
      setCities([]);
      return;
    }

    try {
      setLoading(prev => ({ ...prev, cities: true }));
      const response = await fetch(`https://psgc.cloud/api/provinces/${provinceCode}/cities-municipalities`);
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
    }
  };

  // Fetch barangays by city/municipality
  const fetchBarangays = async (cityCode) => {
    if (!cityCode) {
      setBarangays([]);
      return;
    }

    try {
      setLoading(prev => ({ ...prev, barangays: true }));
      const response = await fetch(`https://psgc.cloud/api/cities-municipalities/${cityCode}/barangays`);
      const data = await response.json();
      setBarangays(data);
    } catch (error) {
      console.error("Error fetching barangays:", error);
    } finally {
      setLoading(prev => ({ ...prev, barangays: false }));
    }
  };

  // Load regions on component mount
  useEffect(() => {
    fetchRegions();
  }, []);

  // Watch for region change to load provinces
  useEffect(() => {
    if (selectedRegion) {
      fetchProvinces(selectedRegion);
      // Clear dependent fields
      setValue("new_address.province", "");
      setValue("new_address.city", "");
      setValue("new_address.barangay", "");
    }
  }, [selectedRegion, setValue]);

  // Watch for province change to load cities
  useEffect(() => {
    if (selectedProvince) {
      fetchCities(selectedProvince);
      // Clear dependent fields
      setValue("new_address.city", "");
      setValue("new_address.barangay", "");
    }
  }, [selectedProvince, setValue]);

  // Watch for city change to load barangays
  useEffect(() => {
    if (selectedCity) {
      fetchBarangays(selectedCity);
      // Clear dependent field
      setValue("new_address.barangay", "");
    }
  }, [selectedCity, setValue]);

  // Fetch customers and products on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers (users with role "customer")
        const customersResult = await pb.collection("users").getFullList({
          filter: 'role = "customer"',
          sort: "name",
          requestKey: null
        });
        setCustomers(customersResult);

        // Use the readProducts service to fetch products with all data
        const productsResult = await getProductsWithAllData(1, 100);
        console.log("Products with all data:", productsResult);

        // Set the products state with the properly structured data
        setProducts(productsResult.items);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Fetch addresses when a customer is selected
  useEffect(() => {
    if (userValue) {
      const fetchAddresses = async () => {
        try {
          const addressesResult = await pb.collection("delivery_information").getFullList({
            filter: `user = "${userValue}"`,
            sort: "name",
            requestKey: null
          });
          setAddresses(addressesResult);

          // If there's at least one address, preselect it
          if (addressesResult.length > 0) {
            setValue("address", addressesResult[0].id);
          } else {
            setValue("address", "");
            // Show address form if payment method is COD and no addresses exist
            if (paymentMethod === "Cash On Delivery") {
              setShowAddressForm(true);
            }
          }
        } catch (error) {
          console.error("Error fetching addresses:", error);
        }
      };

      fetchAddresses();
    } else {
      setAddresses([]);
      setValue("address", "");
    }
  }, [userValue, paymentMethod, setValue]);

  // Handle tab change with validation
  const handleTabChange = (value) => {
    // Only allow changing from customer tab if customer is selected
    if (activeTab === "customer" && value !== "customer" && !userValue && !customerName) {
      alert("Please select or enter customer information before proceeding.");
      return;
    }

    // Only allow changing from products tab if at least one product is selected
    if (activeTab === "products" && value !== "products" && selectedProductIds.length === 0) {
      alert("Please select at least one product before proceeding.");
      return;
    }

    setActiveTab(value);
  };

  // Handle product selection
  const toggleProductSelection = (productId) => {
    if (selectedProductIds.includes(productId)) {
      // Remove the product
      setSelectedProductIds(prev => prev.filter(id => id !== productId));

      // Update form value
      setValue("products", selectedProductIds.filter(id => id !== productId));
    } else {
      // Add the product
      setSelectedProductIds(prev => [...prev, productId]);

      // Initialize quantity if not already set
      if (!productQuantities[productId]) {
        setProductQuantities(prev => ({
          ...prev,
          [productId]: 1
        }));
      }

      // Update form value
      setValue("products", [...selectedProductIds, productId]);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (productId, quantity) => {
    const validQuantity = Math.max(1, parseInt(quantity) || 1);

    setProductQuantities(prev => ({
      ...prev,
      [productId]: validQuantity
    }));
  };

  // Handle address form visibility
  useEffect(() => {
    // Show address form if payment is COD and no address selected
    if (paymentMethod === "Cash On Delivery" && !selectedAddress && addresses.length === 0) {
      setShowAddressForm(true);
    } else {
      setShowAddressForm(false);
    }
  }, [paymentMethod, selectedAddress, addresses.length]);

  // Form submission handler
  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      let userId = data.user; // Will be populated if customer_type is "existing"
      let addressId = data.address;
      let guestUserName = null; // Variable to store guest user name

      // If new customer, store the name but don't create a user
      if (data.customer_type === "new") {
        userId = null; // Ensure userId is null for guest customers
        guestUserName = data.customer_name;
        // Removed the code block that created a new user record
        // try {
        //   const newUser = await pb.collection("users").create({
        //     name: data.customer_name,
        //     email: \`customer_\${Date.now()}@example.com\`, // Placeholder email
        //     password: Math.random().toString(36).slice(-8), // Random password
        //     passwordConfirm: Math.random().toString(36).slice(-8),
        //     role: "customer"
        //   });
        //   userId = newUser.id;
        // } catch (error) {
        //   console.error("Error creating new customer:", error);
        //   throw new Error("Failed to create new customer");
        // }
      }

      // If new address is needed, create it (associated with userId, which might be null)
      if (showAddressForm && data.mode_of_payment === "Cash On Delivery") {
        try {
          const regionObj = regions.find(r => r.code === data.new_address.region);
          const provinceObj = provinces.find(p => p.code === data.new_address.province);
          const cityObj = cities.find(c => c.code === data.new_address.city);
          const barangayObj = barangays.find(b => b.code === data.new_address.barangay);

          const fullAddress = `${data.new_address.street_address}, ${barangayObj?.name || ''}, ${cityObj?.name || ''}, ${provinceObj?.name || ''}, ${regionObj?.name || ''}`;

          const newAddress = await pb.collection("delivery_information").create({
            user: userId, // Pass userId (can be null for guests)
            name: data.new_address.name,
            phone: data.new_address.phone,
            address: fullAddress,
            street_address: data.new_address.street_address,
            region: regionObj?.name || '',
            region_code: data.new_address.region,
            province: provinceObj?.name || '',
            province_code: data.new_address.province,
            city: cityObj?.name || '',
            city_code: data.new_address.city,
            barangay: barangayObj?.name || '',
            barangay_code: data.new_address.barangay,
            zip_code: data.new_address.zip_code,
            additional_notes: data.new_address.additional_notes
          }, {
            requestKey: null
          });

          addressId = newAddress.id;
        } catch (error) {
          console.error("Error creating new address:", error);
          throw new Error("Failed to create delivery address");
        }
      }

      // Prepare order data payload based on customer type
      const orderData = {
        status: data.status,
        products: selectedProductIds, // Assuming quantities are handled elsewhere or not needed here
        mode_of_payment: data.mode_of_payment,
        ...(data.customer_type === "existing" ? { user: userId } : { guest_user: guestUserName }), // Use user or guest_user
        ...(data.mode_of_payment === "Cash On Delivery" ? {
          address: addressId,
          delivery_fee: parseFloat(data.delivery_fee) || 0
        } : {})
      };

      console.log("Submitting Order Data:", orderData); // Log the data being sent

      const newOrder = await createOrder(orderData);

      if (onSuccess) {
        onSuccess(newOrder);
      }

      reset();
      setSelectedProductIds([]);
      setProductQuantities({});
      setSearchTerm("");
      setShowAddressForm(false);

      onClose();
    } catch (error) {
      console.error("Error submitting order form:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAddressForm = () => (
    <div className="border p-4 rounded-md space-y-4 mt-4">
      <h4 className="font-medium">New Delivery Address</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="new_address.name">Contact Name *</Label>
          <Controller
            name="new_address.name"
            control={control}
            rules={{ required: "Contact name is required" }}
            render={({ field }) => (
              <Input
                id="new_address.name"
                placeholder="Contact name"
                className={errors.new_address?.name ? "border-red-500" : ""}
                {...field}
              />
            )}
          />
          {errors.new_address?.name && (
            <p className="text-red-500 text-xs">{errors.new_address.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="new_address.phone">Phone Number *</Label>
          <Controller
            name="new_address.phone"
            control={control}
            rules={{ required: "Phone number is required" }}
            render={({ field }) => (
              <Input
                id="new_address.phone"
                placeholder="Phone number"
                className={errors.new_address?.phone ? "border-red-500" : ""}
                {...field}
              />
            )}
          />
          {errors.new_address?.phone && (
            <p className="text-red-500 text-xs">{errors.new_address.phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_address.street_address">Street Address *</Label>
        <Controller
          name="new_address.street_address"
          control={control}
          rules={{ required: "Street address is required" }}
          render={({ field }) => (
            <Textarea
              id="new_address.street_address"
              placeholder="House/Unit number, street name, building"
              className={errors.new_address?.street_address ? "border-red-500" : ""}
              {...field}
            />
          )}
        />
        {errors.new_address?.street_address && (
          <p className="text-red-500 text-xs">{errors.new_address.street_address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_address.region">Region *</Label>
        <Controller
          name="new_address.region"
          control={control}
          rules={{ required: "Region is required" }}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
            >
              <SelectTrigger className={errors.new_address?.region ? "border-red-500" : ""}>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {loading.regions ? (
                  <SelectItem value="loading" disabled>Loading regions...</SelectItem>
                ) : regions.length === 0 ? (
                  <SelectItem value="not_found" disabled>No regions found</SelectItem>
                ) : (
                  regions.map(region => (
                    <SelectItem key={region.code} value={region.code}>
                      {region.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.new_address?.region && (
          <p className="text-red-500 text-xs">{errors.new_address.region.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_address.province">Province *</Label>
        <Controller
          name="new_address.province"
          control={control}
          rules={{ required: "Province is required" }}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={!selectedRegion || loading.provinces}
            >
              <SelectTrigger className={errors.new_address?.province ? "border-red-500" : ""}>
                <SelectValue placeholder={!selectedRegion ? "Select region first" : "Select province"} />
              </SelectTrigger>
              <SelectContent>
                {loading.provinces ? (
                  <SelectItem value="loading" disabled>Loading provinces...</SelectItem>
                ) : provinces.length === 0 ? (
                  <SelectItem value="not_found" disabled>No provinces found</SelectItem>
                ) : (
                  provinces.map(province => (
                    <SelectItem key={province.code} value={province.code}>
                      {province.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.new_address?.province && (
          <p className="text-red-500 text-xs">{errors.new_address.province.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_address.city">City/Municipality *</Label>
        <Controller
          name="new_address.city"
          control={control}
          rules={{ required: "City/Municipality is required" }}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={!selectedProvince || loading.cities}
            >
              <SelectTrigger className={errors.new_address?.city ? "border-red-500" : ""}>
                <SelectValue placeholder={!selectedProvince ? "Select province first" : "Select city/municipality"} />
              </SelectTrigger>
              <SelectContent>
                {loading.cities ? (
                  <SelectItem value="loading" disabled>Loading cities...</SelectItem>
                ) : cities.length === 0 ? (
                  <SelectItem value="not_found" disabled>No cities found</SelectItem>
                ) : (
                  cities.map(city => (
                    <SelectItem key={city.code} value={city.code}>
                      {city.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.new_address?.city && (
          <p className="text-red-500 text-xs">{errors.new_address.city.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_address.barangay">Barangay *</Label>
        <Controller
          name="new_address.barangay"
          control={control}
          rules={{ required: "Barangay is required" }}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={!selectedCity || loading.barangays}
            >
              <SelectTrigger className={errors.new_address?.barangay ? "border-red-500" : ""}>
                <SelectValue placeholder={!selectedCity ? "Select city/municipality first" : "Select barangay"} />
              </SelectTrigger>
              <SelectContent>
                {loading.barangays ? (
                  <SelectItem value="loading" disabled>Loading barangays...</SelectItem>
                ) : barangays.length === 0 ? (
                  <SelectItem value="not_found" disabled>No barangays found</SelectItem>
                ) : (
                  barangays.map(barangay => (
                    <SelectItem key={barangay.code} value={barangay.code}>
                      {barangay.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.new_address?.barangay && (
          <p className="text-red-500 text-xs">{errors.new_address.barangay.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_address.zip_code">ZIP Code</Label>
        <Controller
          name="new_address.zip_code"
          control={control}
          render={({ field }) => (
            <Input
              id="new_address.zip_code"
              placeholder="ZIP code"
              {...field}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_address.additional_notes">Additional Notes</Label>
        <Controller
          name="new_address.additional_notes"
          control={control}
          render={({ field }) => (
            <Textarea
              id="new_address.additional_notes"
              placeholder="Delivery instructions, landmarks, etc."
              {...field}
            />
          )}
        />
      </div>

      {addresses.length > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAddressForm(false)}
          className="mt-2"
        >
          Cancel
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="customer" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger
                value="products"
                disabled={!userValue && !customerName}
              >
                Products
              </TabsTrigger>
              <TabsTrigger
                value="payment"
                disabled={!userValue && !customerName || selectedProductIds.length === 0}
              >
                Payment & Delivery
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customer" className="space-y-4">
              <div className="space-y-2">
                <Label>Customer Type</Label>
                <Controller
                  name="customer_type"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="existing" id="existing" />
                        <Label htmlFor="existing">Existing Customer</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new" id="new" />
                        <Label htmlFor="new">New Customer</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>

              {customerTypeValue === "existing" ? (
                <div className="space-y-2">
                  <Label htmlFor="user">Select Customer *</Label>
                  <Controller
                    name="user"
                    control={control}
                    rules={{
                      required: customerTypeValue === "existing" ? "Customer selection is required" : false
                    }}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className={errors.user ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name || customer.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.user && (
                    <p className="text-red-500 text-xs">{errors.user.message}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Controller
                    name="customer_name"
                    control={control}
                    rules={{
                      required: customerTypeValue === "new" ? "Customer name is required" : false
                    }}
                    render={({ field }) => (
                      <Input
                        id="customer_name"
                        placeholder="Enter customer name"
                        className={errors.customer_name ? "border-red-500" : ""}
                        {...field}
                      />
                    )}
                  />
                  {errors.customer_name && (
                    <p className="text-red-500 text-xs">{errors.customer_name.message}</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-search">Search Products</Label>
                <Input
                  id="product-search"
                  placeholder="Search by name, model, or brand"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2 mt-4">
                <Label>Available Products</Label>
                <div className="border rounded-md divide-y max-h-80 overflow-y-auto">
                  {products.filter(product =>
                    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.product_model?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(product => (
                    <div key={product.id} className="p-3 flex items-center">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                        className="mr-3"
                      />
                      {product.image ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/products/${product.id}/${product.image}`}
                          alt={product.product_name}
                          className="w-12 h-12 object-cover rounded-md mr-3"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No Image</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{product.product_name}</h4>
                        <p className="text-sm text-gray-600">
                          {product.brand} - {product.product_model}
                        </p>
                      </div>
                      <div className="text-right mr-3">
                        <p className="font-medium">
                          {new Intl.NumberFormat("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }).format(product.pricing?.final_price || 0)}
                        </p>
                        {product.pricing?.discount > 0 && (
                          <p className="text-xs text-green-600">{product.pricing.discount}% off</p>
                        )}
                      </div>
                      {selectedProductIds.includes(product.id) && (
                        <div className="w-20">
                          <Input
                            type="number"
                            min="1"
                            value={productQuantities[product.id] || 1}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mode_of_payment">Payment Method</Label>
                <Controller
                  name="mode_of_payment"
                  control={control}
                  rules={{ required: "Payment method is required" }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash On Delivery">Cash On Delivery</SelectItem>
                        <SelectItem value="On-Store">On-Store</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {paymentMethod === "Cash On Delivery" && (
                <>
                  {addresses.length > 0 && !showAddressForm && (
                    <div className="space-y-2">
                      <Label htmlFor="address">Delivery Address</Label>
                      <Controller
                        name="address"
                        control={control}
                        rules={{ required: "Delivery address is required for Cash On Delivery" }}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className={errors.address ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select delivery address" />
                            </SelectTrigger>
                            <SelectContent>
                              {addresses.map(address => (
                                <SelectItem key={address.id} value={address.id}>
                                  {address.name}: {address.address}
                                </SelectItem>
                              ))}
                              <SelectItem value="new_address">+ Add New Address</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.address && (
                        <p className="text-red-500 text-xs">{errors.address.message}</p>
                      )}
                      {selectedAddress === "new_address" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddressForm(true)}
                          className="mt-2"
                        >
                          Add New Address
                        </Button>
                      )}
                    </div>
                  )}

                  {(showAddressForm || addresses.length === 0) && renderAddressForm()}
                </>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !userValue && !customerName || selectedProductIds.length === 0}
            >
              {isSubmitting ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
