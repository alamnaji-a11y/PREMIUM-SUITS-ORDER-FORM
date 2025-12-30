
import React, { useState, useEffect, useMemo } from 'react';
import { FormData } from '../types';

interface Order {
  [key: string]: any;
  "Order ID": string;
  "Date": string;
  "Customer": string;
  "Product": string;
  "Store": string;
  "Full Data"?: string;
}

interface DashboardProps {
  scriptUrl: string;
  onLoadOrder: (data: FormData) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ scriptUrl, onLoadOrder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [scriptUrl]);

  const fetchOrders = async () => {
    if (!scriptUrl) {
      setError("Cloud Sync Not Configured");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(scriptUrl);
      if (!response.ok) throw new Error("Connection failed");
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError("Unable to fetch ledger. Ensure Script is deployed as Web App.");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => 
      Object.values(order).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [orders, searchTerm]);

  const getFullDataFromOrder = (order: Order): FormData => {
    if (order["Full Data"]) {
      try { return JSON.parse(order["Full Data"]); } 
      catch (e) { console.warn(e); }
    }
    return order as unknown as FormData;
  };

  const AllFieldsDisplay = ({ order }: { order: Order }) => {
    // Exclude redundant dashboard-only mapping keys
    const excluded = ["Order ID", "Date", "Customer", "Product", "Store", "Full Data", "FULL_JSON_BACKUP", "htmlBody", "userEmail"];
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
        {Object.entries(order)
          .filter(([k, v]) => !excluded.includes(k) && v && v !== "")
          .map(([k, v]) => (
            <div key={k} className="p-3 bg-white rounded-xl border border-slate-100 flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{k.replace(/_/g, ' ')}</span>
              <span className="text-xs font-black text-slate-900 truncate">{String(v)}</span>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] border shadow-2xl overflow-hidden">
        <div className="p-8 border-b bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Production Ledger</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vertical Column Database</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Filter by name, ID, fabric..." 
              className="flex-1 md:w-64 px-6 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button onClick={fetchOrders} className="w-12 h-12 bg-white border rounded-xl flex items-center justify-center hover:text-blue-600 transition-all shadow-sm">
              <i className="fa-solid fa-rotate"></i>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="p-6">Order ID</th>
                <th className="p-6">Date</th>
                <th className="p-6">Customer</th>
                <th className="p-6">Product</th>
                <th className="p-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order, i) => (
                <React.Fragment key={i}>
                  <tr className="hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => setExpandedOrderId(expandedOrderId === order["Order ID"] ? null : order["Order ID"])}>
                    <td className="p-6 font-black text-slate-900">{order["Order ID"]}</td>
                    <td className="p-6 text-xs font-bold text-slate-500">{order["Date"]}</td>
                    <td className="p-6 font-bold text-slate-800">{order["Customer"]}</td>
                    <td className="p-6 text-[10px] font-black uppercase text-slate-500">{order["Product"]}</td>
                    <td className="p-6 text-right">
                       <button 
                          onClick={(e) => { e.stopPropagation(); onLoadOrder(getFullDataFromOrder(order)); }}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-blue-600 shadow-md uppercase tracking-wider transition-all"
                        >
                          Load Profile
                        </button>
                    </td>
                  </tr>
                  {expandedOrderId === order["Order ID"] && (
                    <tr>
                      <td colSpan={5} className="p-8 bg-slate-50/80 border-y">
                        <div className="mb-4 flex justify-between items-center">
                          <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Full Technical Data Extracted from Sheet Rows</h4>
                          <span className="text-[10px] font-bold text-slate-400 italic">Showing all non-empty vertical rows</span>
                        </div>
                        <AllFieldsDisplay order={order} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && !loading && (
             <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                No Ledger Entries Found
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
