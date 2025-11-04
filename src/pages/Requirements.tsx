import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { identifyInstruments } from '@/components/AIRecommender/api';

interface IdentifiedInstrument {
  category: string;
  productName: string;
  specifications: Record<string, string>;
  sampleInput: string;
}

interface IdentifiedAccessory {
  category: string;
  accessoryName: string;
  specifications: Record<string, string>;
  sampleInput: string;
}

const Requirements = () => {
  const [requirements, setRequirements] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [instruments, setInstruments] = useState<IdentifiedInstrument[]>([]);
  const [accessories, setAccessories] = useState<IdentifiedAccessory[]>([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!requirements.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter your requirements",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await identifyInstruments(requirements);
      setInstruments(response.instruments || []);
      setAccessories(response.accessories || []);
      setShowResults(true);
      
      const totalItems = (response.instruments?.length || 0) + (response.accessories?.length || 0);
      toast({
        title: "Success",
        description: `Identified ${response.instruments?.length || 0} instruments and ${response.accessories?.length || 0} accessories`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to identify instruments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRun = (instrument: IdentifiedInstrument) => {
    // Use sessionStorage to avoid URL length limitations (browser limit ~2048 chars)
    // This allows passing large sample inputs with many specifications
    const storageKey = `instrument_input_${Date.now()}`;
    sessionStorage.setItem(storageKey, instrument.sampleInput);
    
    // Open dashboard in new tab with storage key reference
    const dashboardUrl = `/dashboard?inputKey=${storageKey}`;
    window.open(dashboardUrl, '_blank');
  };

  const handleRunAccessory = (accessory: IdentifiedAccessory) => {
    // Same approach as instruments - use sessionStorage for large inputs
    const storageKey = `accessory_input_${Date.now()}`;
    sessionStorage.setItem(storageKey, accessory.sampleInput);
    
    // Open dashboard in new tab with storage key reference
    const dashboardUrl = `/dashboard?inputKey=${storageKey}`;
    window.open(dashboardUrl, '_blank');
  };

  return (
    <div className="min-h-screen app-gradient flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl">
        <div className="surface-card p-8 rounded-2xl">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold">
              What are your requirements?
            </h1>
            <p className="text-muted-foreground text-lg">
              Describe your Industrial Process Control System needs
            </p>
          </div>

          {!showResults ? (
            /* Input Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Textarea
                  placeholder="Example: I need a pressure transmitter for measuring 0-100 bar with 4-20mA output and a temperature sensor for 0-200°C..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[200px] text-base resize-none rounded-xl"
                  disabled={isLoading}
                />
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading || !requirements.trim()}
                    className="btn-primary px-8 py-6 text-lg rounded-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            /* Results Display */
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Identified Instruments ({instruments.length})
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResults(false);
                    setInstruments([]);
                    setAccessories([]);
                    setRequirements('');
                  }}
                  className="rounded-xl"
                >
                  New Search
                </Button>
              </div>

              {/* Instruments Section */}
              {instruments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Instruments</h3>
                  {instruments.map((instrument, index) => (
                    <div
                      key={index}
                      className="border rounded-xl p-6 space-y-4 hover:shadow-lg transition-shadow"
                    >
                      {/* Category and Product Name */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold">
                            {instrument.category}
                          </h3>
                          <p className="text-muted-foreground">
                            {instrument.productName}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleRun(instrument)}
                          className="btn-primary rounded-xl px-6"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Search
                        </Button>
                      </div>

                      {/* Specifications */}
                      {Object.keys(instrument.specifications).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Specifications:
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(instrument.specifications).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium">{key}:</span>{' '}
                                <span className="text-muted-foreground">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sample Input Preview */}
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Sample Input:</p>
                        <p className="text-sm bg-muted p-3 rounded-lg font-mono">
                          {instrument.sampleInput}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Accessories Section */}
              {accessories.length > 0 && (
                <div className="space-y-4 mt-8">
                  <h3 className="text-lg font-semibold text-primary">Accessories</h3>
                  {accessories.map((accessory, index) => (
                    <div
                      key={index}
                      className="border border-dashed rounded-xl p-6 space-y-4 hover:shadow-lg transition-shadow bg-muted/30"
                    >
                      {/* Category and Accessory Name */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold">
                            {accessory.category}
                          </h3>
                          <p className="text-muted-foreground">
                            {accessory.accessoryName}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleRunAccessory(accessory)}
                          className="btn-primary rounded-xl px-6"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Search
                        </Button>
                      </div>

                      {/* Specifications */}
                      {Object.keys(accessory.specifications).length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">
                            Specifications:
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(accessory.specifications).map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium">{key}:</span>{' '}
                                <span className="text-muted-foreground">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sample Input Preview */}
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Sample Input:</p>
                        <p className="text-sm bg-muted p-3 rounded-lg font-mono">
                          {accessory.sampleInput}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Requirements;
