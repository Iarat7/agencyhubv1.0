import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface HeatMapData {
  productId: number;
  productName: string;
  salesCount: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
  intensity: number; // 0-100 for heat intensity
}

export function ProductHeatMap() {
  const [hoveredProduct, setHoveredProduct] = useState<HeatMapData | null>(null);
  
  const { data: salesData = [] } = useQuery({
    queryKey: ["/api/product-sales"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Process data for heat map
  const heatMapData: HeatMapData[] = products.map((product: any) => {
    const productSales = salesData.filter((sale: any) => sale.productId === product.id);
    const salesCount = productSales.length;
    const revenue = productSales.reduce((sum: number, sale: any) => sum + sale.amount, 0);
    
    // Calculate intensity based on revenue (0-100)
    const maxRevenue = Math.max(...products.map((p: any) => {
      const pSales = salesData.filter((s: any) => s.productId === p.id);
      return pSales.reduce((sum: number, sale: any) => sum + sale.amount, 0);
    }));
    
    const intensity = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
    
    // Determine trend (simplified - could be enhanced with time-based data)
    const trend = intensity > 66 ? 'up' : intensity > 33 ? 'stable' : 'down';
    
    return {
      productId: product.id,
      productName: product.name,
      salesCount,
      revenue,
      trend,
      intensity
    };
  });

  const getHeatColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 25) return 'bg-blue-200';
    if (intensity < 50) return 'bg-green-200';
    if (intensity < 75) return 'bg-yellow-200';
    return 'bg-red-200';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Mapa de Calor - Performance de Vendas
          <div className="ml-auto flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <span>Sem vendas</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span>Baixo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 rounded"></div>
              <span>Médio</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-200 rounded"></div>
              <span>Alto</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 rounded"></div>
              <span>Muito Alto</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Heat Map Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
          {heatMapData.map((item) => (
            <div
              key={item.productId}
              className={`
                relative p-3 rounded-lg cursor-pointer transition-all duration-300 
                hover:scale-105 hover:shadow-lg border-2 hover:border-slate-300
                ${getHeatColor(item.intensity)}
              `}
              onMouseEnter={() => setHoveredProduct(item)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              <div className="text-center">
                <div className="text-xs font-medium text-slate-700 mb-1 truncate">
                  {item.productName}
                </div>
                <div className="flex items-center justify-center gap-1">
                  {getTrendIcon(item.trend)}
                  <span className="text-sm font-bold">
                    {item.salesCount}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  R$ {item.revenue.toLocaleString('pt-BR')}
                </div>
              </div>
              
              {/* Pulse animation for high performers */}
              {item.intensity > 75 && (
                <div className="absolute inset-0 rounded-lg animate-pulse bg-red-200 opacity-30"></div>
              )}
            </div>
          ))}
        </div>

        {/* Hover Details */}
        {hoveredProduct && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border-l-4 border-primary">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900">{hoveredProduct.productName}</h4>
              {getTrendIcon(hoveredProduct.trend)}
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Vendas</p>
                <p className="font-semibold">{hoveredProduct.salesCount}</p>
              </div>
              <div>
                <p className="text-slate-600">Receita</p>
                <p className="font-semibold">R$ {hoveredProduct.revenue.toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-slate-600">Performance</p>
                <p className="font-semibold">{hoveredProduct.intensity.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {heatMapData.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>Nenhum dado de vendas disponível</p>
            <p className="text-sm">Adicione produtos e registre vendas para ver o mapa de calor</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}