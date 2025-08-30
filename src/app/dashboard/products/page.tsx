'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import ProductImport from '@/components/ProductImport'

interface Product {
  id: string
  name: string
  sku: string
  price: number | string // Can be Decimal from database (string) or number
  cost: number | string // Can be Decimal from database (string) or number
  stock: number
  categories: {
    name: string
  }
}

export default function ProductsPage() {
  const { addNotification } = useNotifications()
  const { formatCurrency } = useCurrency()
  const { settings } = useSettings()
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      } else {
        console.error('Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    addNotification({
      type: 'warning',
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      duration: 0,
      actions: [
        {
          label: 'Cancel',
          onClick: () => {},
          variant: 'secondary'
        },
        {
          label: 'Delete',
          variant: 'danger',
          onClick: async () => {
            try {
              const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE'
              })

              if (response.ok) {
                // Refresh the products list
                fetchProducts()
                addNotification({
                  type: 'success',
                  title: 'Product Deleted',
                  message: 'Product has been deleted successfully.',
                  duration: 4000
                })
              } else {
                const errorData = await response.json()
                addNotification({
                  type: 'error',
                  title: 'Delete Failed',
                  message: `Failed to delete product: ${errorData.error}`,
                  duration: 5000
                })
              }
            } catch (error) {
              console.error('Error deleting product:', error)
              addNotification({
                type: 'error',
                title: 'Delete Failed',
                message: 'Failed to delete product. Please try again.',
                duration: 5000
              })
            }
          }
        }
      ]
    })
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.categories.name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(products.map(p => p.categories.name)))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

     return (
     <div className="space-y-4 xs:space-y-5 sm:space-y-6">
       {/* Header */}
       <div className="sm:flex sm:items-center sm:justify-between">
         <div>
           <h1 className="text-lg xs:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Products</h1>
           <p className="mt-1 xs:mt-2 md:mt-3 text-xs xs:text-sm md:text-base text-gray-700">
             Manage your product inventory and stock levels.
           </p>
         </div>
         <div className="mt-3 xs:mt-4 md:mt-6 sm:mt-0 flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2 md:space-x-4 sm:space-x-3">
           <button
             onClick={() => setShowImport(!showImport)}
             className="inline-flex items-center justify-center px-2.5 xs:px-3 md:px-4 lg:px-6 py-1.5 xs:py-2 md:py-2.5 lg:py-3 border border-gray-300 rounded-md shadow-sm text-xs xs:text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
           >
             <CloudArrowUpIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 mr-1 xs:mr-1.5 md:mr-2 lg:mr-3" />
             Bulk Import
           </button>
           <Link
             href="/dashboard/categories"
             className="inline-flex items-center justify-center px-2.5 xs:px-3 md:px-4 lg:px-6 py-1.5 xs:py-2 md:py-2.5 lg:py-3 border border-gray-300 rounded-md shadow-sm text-xs xs:text-sm md:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
           >
             <TagIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 mr-1 xs:mr-1.5 md:mr-2 lg:mr-3" />
             Manage Categories
           </Link>
           <Link
             href="/dashboard/products/new"
             className="inline-flex items-center justify-center px-2.5 xs:px-3 md:px-4 lg:px-6 py-1.5 xs:py-2 md:py-2.5 lg:py-3 border border-transparent rounded-md shadow-sm text-xs xs:text-sm md:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
           >
             <PlusIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 mr-1 xs:mr-1.5 md:mr-2 lg:mr-3" />
             Add Product
           </Link>
         </div>
       </div>

       {/* Bulk Import Section */}
       {showImport && (
         <div className="mb-6">
           <ProductImport />
         </div>
       )}

       {/* Filters and Search */}
       <div className="bg-white shadow rounded-lg p-2.5 xs:p-3 md:p-4 lg:p-5">
         <div className="grid grid-cols-1 gap-2.5 xs:gap-3 md:gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {/* Search */}
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-2.5 xs:pl-3 md:pl-3 lg:pl-4 flex items-center pointer-events-none">
               <MagnifyingGlassIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-400" />
             </div>
             <input
               type="text"
               placeholder="Search products..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="block w-full pl-8 xs:pl-9 md:pl-10 lg:pl-12 pr-2.5 xs:pr-3 md:pr-3 lg:pr-4 py-1.5 xs:py-2 md:py-2.5 lg:py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm md:text-sm lg:text-base"
             />
           </div>

           {/* Category Filter */}
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-2.5 xs:pl-3 md:pl-3 lg:pl-4 flex items-center pointer-events-none">
               <FunnelIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-400" />
             </div>
             <select
               value={selectedCategory}
               onChange={(e) => setSelectedCategory(e.target.value)}
               className="block w-full pl-8 xs:pl-9 md:pl-10 lg:pl-12 pr-2.5 xs:pr-3 md:pr-3 lg:pr-4 py-1.5 xs:py-2 md:py-2.5 lg:py-3 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm md:text-sm lg:text-base"
             >
               {categories.map(category => (
                 <option key={category} value={category}>
                   {category === 'all' ? 'All Categories' : category}
                 </option>
               ))}
             </select>
           </div>
         </div>
       </div>

       {/* Products Grid */}
       <div className="bg-white shadow rounded-lg">
         <div className="px-2.5 xs:px-3 md:px-4 lg:px-6 py-3 xs:py-4 md:py-5 lg:py-6">
           <div className="grid grid-cols-1 gap-2.5 xs:gap-3 md:gap-4 lg:gap-6 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
             {filteredProducts.map((product) => (
               <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-2.5 xs:p-3 md:p-4 lg:p-5 hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start mb-1.5 xs:mb-2 md:mb-2.5 lg:mb-3">
                   <h3 className="text-sm xs:text-base md:text-lg lg:text-xl font-medium text-gray-900 truncate">{product.name}</h3>
                   <div className="flex space-x-0.5 xs:space-x-1 md:space-x-1.5 lg:space-x-2">
                     <Link
                       href={`/dashboard/products/${product.id}/edit`}
                       className="p-1 xs:p-1.5 md:p-2 text-gray-400 hover:text-blue-600"
                     >
                       <PencilIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5" />
                     </Link>
                     <button 
                       onClick={() => handleDeleteProduct(product.id)}
                       className="p-1 xs:p-1.5 md:p-2 text-gray-400 hover:text-red-600"
                     >
                       <TrashIcon className="h-3.5 w-3.5 xs:h-4 xs:w-4 md:h-5 md:w-5" />
                     </button>
                   </div>
                 </div>
                 
                 <p className="text-xs xs:text-sm md:text-sm lg:text-base text-gray-500 mb-1.5 xs:mb-2 md:mb-2.5 lg:mb-3">SKU: {product.sku}</p>
                 <p className="text-xs xs:text-sm md:text-sm lg:text-base text-gray-500 mb-2 xs:mb-2.5 md:mb-3 lg:mb-4">Category: {product.categories.name}</p>
                 
                 <div className="space-y-1 xs:space-y-1.5 md:space-y-2 lg:space-y-3">
                   <div className="flex justify-between">
                     <span className="text-xs xs:text-sm md:text-sm lg:text-base text-gray-600">Price:</span>
                     <span className="text-xs xs:text-sm md:text-sm lg:text-base font-medium text-gray-900">{formatCurrency(Number(product.price))}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-xs xs:text-sm md:text-sm lg:text-base text-gray-600">Cost:</span>
                     <span className="text-xs xs:text-sm md:text-sm lg:text-base font-medium text-gray-900">{formatCurrency(Number(product.cost))}</span>
                   </div>
                                       <div className="flex justify-between">
                      <span className="text-xs xs:text-sm md:text-sm lg:text-base text-gray-600">Stock:</span>
                      <span className="text-xs xs:text-sm md:text-sm lg:text-base font-medium text-gray-900">
                        {product.stock}
                      </span>
                    </div>
                  </div>
               </div>
             ))}
           </div>

           {filteredProducts.length === 0 && (
             <div className="text-center py-6 xs:py-8 md:py-12 lg:py-16">
               <p className="text-xs xs:text-sm md:text-base lg:text-lg text-gray-500">No products found</p>
               <p className="text-xs xs:text-xs md:text-sm lg:text-base text-gray-400 mt-1">Try adjusting your search or filters</p>
             </div>
           )}
         </div>
       </div>
     </div>
   )
 }
