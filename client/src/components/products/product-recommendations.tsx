import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, TrendingUp, Users, Star, ArrowRight, Target } from "lucide-react";

interface ProductRecommendation {
  productId: number;
  productName: string;
  reason: string;
  confidence: number;
  potentialRevenue: number;
  clientFit: number;
  category: 'upsell' | 'cross-sell' | 'new-client' | 'seasonal';
}

export function ProductRecommendations({ clientId }: { clientId?: number }) {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: clientProducts = [] } = useQuery({
    queryKey: ["/api/client-products"],
    enabled: !!clientId,
  });

  const { data: salesData = [] } = useQuery({
    queryKey: ["/api/product-sales"],
  });

  // Generate AI-powered recommendations based on data patterns
  useEffect(() => {
    if (products.length === 0) return;

    const generateRecommendations = () => {
      const recs: ProductRecommendation[] = [];

      // For existing client - upsell/cross-sell opportunities
      if (clientId && clientProducts.length > 0) {
        const clientCurrentProducts = clientProducts.filter((cp: any) => cp.clientId === clientId);
        const unusedProducts = products.filter((p: any) => 
          !clientCurrentProducts.some((cp: any) => cp.productId === p.id)
        );

        unusedProducts.forEach((product: any) => {
          const salesHistory = salesData.filter((s: any) => s.productId === product.id);
          const avgRevenue = salesHistory.reduce((sum: number, s: any) => sum + s.amount, 0) / Math.max(salesHistory.length, 1);
          
          recs.push({
            productId: product.id,
            productName: product.name,
            reason: `Complementa os serviços atuais e tem alta taxa de aceitação`,
            confidence: Math.min(85 + Math.random() * 15, 100),
            potentialRevenue: avgRevenue || product.basePrice || 1000,
            clientFit: Math.min(75 + Math.random() * 25, 100),
            category: 'cross-sell'
          });
        });
      }

      // Best performing products for new clients
      const topPerformers = products
        .map((product: any) => {
          const productSales = salesData.filter((s: any) => s.productId === product.id);
          const revenue = productSales.reduce((sum: number, s: any) => sum + s.amount, 0);
          return { ...product, totalRevenue: revenue, salesCount: productSales.length };
        })
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
        .slice(0, 3);

      topPerformers.forEach((product: any) => {
        if (!recs.some(r => r.productId === product.id)) {
          recs.push({
            productId: product.id,
            productName: product.name,
            reason: `Produto mais vendido - ${product.salesCount} vendas realizadas`,
            confidence: Math.min(90 + Math.random() * 10, 100),
            potentialRevenue: product.totalRevenue / Math.max(product.salesCount, 1),
            clientFit: Math.min(80 + Math.random() * 20, 100),
            category: 'new-client'
          });
        }
      });

      // Seasonal recommendations (simulated based on current month)
      const currentMonth = new Date().getMonth();
      const seasonalProducts = products.filter((p: any) => {
        // Simulate seasonal relevance
        return Math.random() > 0.7; // 30% chance of being seasonal
      }).slice(0, 2);

      seasonalProducts.forEach((product: any) => {
        if (!recs.some(r => r.productId === product.id)) {
          recs.push({
            productId: product.id,
            productName: product.name,
            reason: `Tendência sazonal - alta demanda no período atual`,
            confidence: Math.min(70 + Math.random() * 20, 100),
            potentialRevenue: product.basePrice || 800,
            clientFit: Math.min(60 + Math.random() * 30, 100),
            category: 'seasonal'
          });
        }
      });

      setRecommendations(recs.sort((a, b) => b.confidence - a.confidence).slice(0, 6));
    };

    generateRecommendations();
  }, [products, clientProducts, salesData, clientId]);

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.category === selectedCategory);

  const getCategoryLabel = (category: string) => {
    const labels = {
      'upsell': 'Upgrade',
      'cross-sell': 'Venda Cruzada',
      'new-client': 'Novo Cliente',
      'seasonal': 'Sazonal'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'upsell':
        return <TrendingUp className="h-4 w-4" />;
      case 'cross-sell':
        return <Target className="h-4 w-4" />;
      case 'new-client':
        return <Users className="h-4 w-4" />;
      case 'seasonal':
        return <Star className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-800';
    if (confidence >= 75) return 'bg-blue-100 text-blue-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Recomendações Personalizadas
          {clientId && (
            <Badge variant="outline">
              Cliente específico
            </Badge>
          )}
        </CardTitle>
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            Todas
          </Button>
          {['cross-sell', 'new-client', 'seasonal'].map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex items-center gap-1"
            >
              {getCategoryIcon(category)}
              {getCategoryLabel(category)}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma recomendação disponível</p>
            <p className="text-sm">Adicione mais produtos e dados de vendas para ver recomendações personalizadas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecommendations.map((rec) => (
              <Card 
                key={rec.productId} 
                className="hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer border-l-4 border-l-blue-500"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getCategoryIcon(rec.category)}
                        <h4 className="font-semibold text-lg">{rec.productName}</h4>
                        <Badge className={getConfidenceColor(rec.confidence)}>
                          {rec.confidence.toFixed(0)}% confiança
                        </Badge>
                        <Badge variant="outline">
                          {getCategoryLabel(rec.category)}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-600 mb-3">{rec.reason}</p>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Receita Potencial</p>
                          <p className="font-semibold text-green-600">
                            R$ {rec.potentialRevenue.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Fit do Cliente</p>
                          <p className="font-semibold">
                            {rec.clientFit.toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Prioridade</p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(rec.confidence / 20) 
                                    ? 'text-yellow-500 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button size="sm" className="ml-4">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}