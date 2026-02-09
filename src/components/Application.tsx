import { useState, useEffect } from 'react';
import { Send, CheckCircle, ArrowRight, User, AlertTriangle, Lock, ArrowLeft, ChevronRight, Shield } from 'lucide-react';
import { saveApplication, getAppForms, getSession, formatScheduleDate, type AppForm } from '../lib/store';

export default function Application() {
  const [selectedForm, setSelectedForm] = useState<AppForm | null>(null);
  const [appForms, setAppForms] = useState<AppForm[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const user = getSession();

  useEffect(() => {
    const forms = getAppForms();
    setAppForms(forms);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedForm) return;
    
    setError('');
    
    // Validate required fields
    const missingFields = selectedForm.fields.filter(f => f.enabled && f.required && !formData[f.id]);
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const appData = {
      userId: user.id,
      formId: selectedForm.id,
      formName: selectedForm.name,
      username: formData['username'] || user.displayName,
      responses: formData,
      // Fallbacks for legacy structure
      age: formData['age'] || '',
      timezone: formData['timezone'] || '',
      why: formData['why'] || formData['ban-reason'] || formData['staff-experience'] || '',
      experience: formData['experience'] || formData['availability'] || formData['learned'] || '',
    };

    saveApplication(appData);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleFieldChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const isBanned = user?.status === 'banned';

  return (
    <section id="apply" className="py-24 relative overflow-hidden bg-neutral-950">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {isSubmitted ? (
          <div className="bg-neutral-900/50 border border-emerald-500/20 rounded-3xl p-12 text-center animate-fade-in">
            <div className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="text-emerald-500" size={40} />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Submission Successful!</h3>
            <p className="text-neutral-400 text-lg mb-8 max-w-md mx-auto">
              Your submission has been received. Our staff will review it soon.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => window.location.hash = '#portal'} className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-neutral-950 font-bold rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                Go to Portal <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Application Center</h2>
              <p className="text-neutral-500">
                {isBanned ? "Your account is restricted. You may only submit a Ban Appeal." : "Select the appropriate form to begin your application."}
              </p>
            </div>

            {status === 'ending_soon' && !isBanned && (
              <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-3 text-orange-400 animate-pulse">
                <AlertTriangle size={20} />
                <span className="text-sm font-semibold uppercase tracking-wider">Hurry! Applications are closing soon.</span>
              </div>
            )}

            {!user ? (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
                <User className="text-neutral-500 mx-auto mb-6" size={48} />
                <h3 className="text-2xl font-bold text-white mb-4">Sign In to Continue</h3>
                <p className="text-neutral-400 mb-8">You need an account to submit applications and appeals.</p>
                <button onClick={() => window.location.hash = '#login'} className="px-8 py-4 bg-emerald-500 text-neutral-950 font-bold rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 mx-auto">
                  Get Started <ArrowRight size={18} />
                </button>
              </div>
            ) : !selectedForm ? (
              <div className="space-y-4">
                {appForms.filter(f => f.enabled).map(form => {
                  const isBannedRestricted = isBanned && form.id !== 'ban-appeal';
                  const isComingSoon = form.status === 'coming_soon';
                  const isClosed = form.status === 'closed';
                  const isEndingSoon = form.status === 'ending_soon';
                  
                  const isDisabled = isBannedRestricted || isComingSoon || isClosed;
                  
                  return (
                    <div key={form.id} className="relative">
                      <button
                        disabled={isDisabled}
                        onClick={() => setSelectedForm(form)}
                        className={`w-full p-6 text-left rounded-2xl border transition-all flex items-center justify-between group ${isDisabled ? 'bg-neutral-900/20 border-neutral-800 cursor-not-allowed' : 'bg-neutral-900/40 border-neutral-800/60 hover:border-emerald-500/30 hover:bg-neutral-800/60 hover:shadow-xl shadow-emerald-500/5'}`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${isDisabled ? 'bg-neutral-800 text-neutral-600' : form.id === 'ban-appeal' ? 'bg-red-500/10 text-red-500' : form.id === 'staff-app' ? 'bg-purple-500/10 text-purple-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {form.id === 'ban-appeal' ? <AlertTriangle size={24} /> : form.id === 'staff-app' ? <Shield size={24} /> : <User size={24} />}
                          </div>
                          <div className={isDisabled ? 'opacity-40 grayscale' : ''}>
                            <div className="flex items-center gap-3">
                              <h4 className={`font-bold transition-colors ${isDisabled ? 'text-neutral-500' : 'text-white group-hover:text-emerald-400'}`}>{form.name}</h4>
                              {isComingSoon && <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">Coming Soon</span>}
                              {isClosed && <span className="text-[9px] font-black bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-wider">Ended</span>}
                              {isEndingSoon && <span className="text-[9px] font-black bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-wider">Ending Soon</span>}
                            </div>
                            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                              {isComingSoon && form.schedule?.openDate 
                                ? `Opens on ${formatScheduleDate(form.schedule.openDate)}` 
                                : form.description}
                            </p>
                          </div>
                        </div>
                        {!isDisabled ? (
                          <ChevronRight size={20} className="text-neutral-700 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
                        ) : (
                          <Lock size={18} className="text-neutral-800" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="animate-fade-in">
                <button onClick={() => { setSelectedForm(null); setError(''); }} className="flex items-center gap-2 text-xs font-black text-neutral-500 hover:text-white uppercase tracking-widest mb-8 group transition-colors">
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Change Form
                </button>

                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-black text-white tracking-tight">{selectedForm.name}</h3>
                    {selectedForm.status === 'ending_soon' && (
                      <span className="text-[10px] font-black bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-lg border border-orange-500/20 uppercase tracking-widest animate-pulse">Ending Soon</span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500">{selectedForm.description}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedForm.fields.filter(f => f.enabled).map((field) => (
                      <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <label className="block text-[10px] font-black text-neutral-500 mb-2 uppercase tracking-[0.2em] flex items-center gap-1.5">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </label>
                        
                        {field.type === 'select' ? (
                          <div className="relative">
                            <select
                              required={field.required}
                              value={formData[field.id] || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              className="w-full px-5 py-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
                            >
                              <option value="" disabled>{field.placeholder || 'Select option...'}</option>
                              {field.options?.map(opt => (
                                <option key={opt} value={opt} className="bg-neutral-900">{opt}</option>
                              ))}
                            </select>
                            <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-neutral-600 pointer-events-none" />
                          </div>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            required={field.required}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            rows={4}
                            className="w-full px-5 py-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                          />
                        ) : (
                          <input
                            type={field.type}
                            required={field.required}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-5 py-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold uppercase tracking-wide">
                      <AlertTriangle size={18} />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-emerald-500 text-neutral-950 font-black rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed group uppercase tracking-[0.2em] text-sm"
                  >
                    {isSubmitting ? (
                      <>Processing Submission...</>
                    ) : (
                      <>
                        Submit {selectedForm.name} <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}