import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Camera, Check, Save, User, X } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { RootState } from '../store';
import { updateUser } from '../store/authSlice';

const currencyOptions = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'CAD', label: 'CAD ($)' },
];

const getCurrencySymbol = (currencyCode: string): string => {
  const currency = currencyOptions.find(c => c.value === currencyCode);
  return currency ? currency.label.split(' ')[1].replace(/[()]/g, '') : '₹';
};

const ProfileSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
      {children}
    </div>
  );
};

const CategoryPill: React.FC<{
  category: string;
  onRemove: (category: string) => void;
}> = ({ category, onRemove }) => {
  return (
    <div className="flex items-center space-x-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100 px-3 py-1 rounded-full">
      <span>{category}</span>
      <button
        type="button"
        onClick={() => onRemove(category)}
        className="ml-1 text-primary-800 dark:text-primary-100 hover:text-primary-600 dark:hover:text-primary-300"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currency: user?.currency || 'USD',
  });
  
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<string[]>(user?.preferredCategories || []);
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };
  
  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    dispatch(updateUser({
      ...formData,
      preferredCategories: categories,
    }));
    
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };
  
  if (!user) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card className="p-5 flex flex-col items-center">
            <div className="relative mb-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="User avatar"
                  className="h-32 w-32 rounded-full object-cover border-4 border-white dark:border-gray-800"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <User className="h-16 w-16 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            
            <div className="mt-6 w-full">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">March 2023</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Currency</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{user.currency}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Categories</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{categories.length}</span>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          <Card className="p-6">
            <form onSubmit={handleSubmit}>
              <ProfileSection title="Personal Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                  />
                </div>
              </ProfileSection>
              
              <ProfileSection title="Preferences">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="input-group">
                    <label htmlFor="currency" className="input-label">
                      Currency
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2"
                    >
                      {currencyOptions.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </ProfileSection>
              
              <ProfileSection title="Expense Categories">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <CategoryPill
                        key={category}
                        category={category}
                        onRemove={handleRemoveCategory}
                      />
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Add a category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddCategory}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </ProfileSection>
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save className="h-4 w-4" />}
                >
                  Save Changes
                </Button>
                
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="ml-4 flex items-center text-success-600 dark:text-success-400"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    <span>Changes saved successfully</span>
                  </motion.div>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
export { getCurrencySymbol };