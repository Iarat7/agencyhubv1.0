import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, Edit, Trash2, MoreVertical, TrendingUp, Users, DollarSign, Star } from "lucide-react";
import type { Product } from "@shared/schema";

interface EnhancedProductCardProps {
  product: Product;
  salesData?: any[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

export function EnhancedProductCard({ 
  product, 
  salesData = [], 
  onView, 
  onEdit, 
  onDelete 
}: EnhancedProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Calculate product metrics
  const productSales = salesData.filter(sale => sale.productId === product.id);
  const totalSales = productSales.length;
  const totalRevenue = productSales.reduce((sum, sale) => sum + sale.amount, 0);
  const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  const getPerformanceLevel = () => {
    if (totalSales === 0) return { level: 'new', color: 'bg-gray-100 text-gray-800', label: 'Novo' };
    if (totalSales >= 10) return { level: 'high', color: 'bg-green-100 text-green-800', label: 'Alto' };
    if (totalSales >= 5) return { level: 'medium', color: 'bg-blue-100 text-blue-800', label: 'Médio' };
    return { level: 'low', color: 'bg-yellow-100 text-yellow-800', label: 'Baixo' };
  };

  const performance = getPerformanceLevel();

  return (
    <Card 
      className={`
        relative overflow-hidden cursor-pointer transition-all duration-300 ease-in-out
        ${isHovered ? 'shadow-xl scale-[1.02] border-blue-300' : 'shadow-md hover:shadow-lg'}
        ${isPressed ? 'scale-[0.98]' : ''}
        group
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {/* Animated background gradient on hover */}
      <div className={`
        absolute inset-0 opacity-0 bg-gradient-to-br from-blue-50 to-indigo-50 
        transition-opacity duration-300
        ${isHovered ? 'opacity-100' : ''}
      `} />
      
      {/* Performance indicator bar */}
      <div className={`
        absolute top-0 left-0 h-1 bg-gradient-to-r transition-all duration-500
        ${performance.level === 'high' ? 'from-green-400 to-green-600 w-full' : 
          performance.level === 'medium' ? 'from-blue-400 to-blue-600 w-3/4' :
          performance.level === 'low' ? 'from-yellow-400 to-yellow-600 w-1/2' : 'w-0'}
      `} />

      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={`
              text-lg transition-colors duration-200
              ${isHovered ? 'text-blue-700' : 'text-gray-900'}
            `}>
              {product.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {product.description || "Sem descrição"}
            </p>
          </div>
          
          {/* Action menu with subtle animation */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className={`
                  transition-all duration-200
                  ${isHovered ? 'opacity-100 scale-100' : 'opacity-60 scale-90'}
                  hover:bg-white/80
                `}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView(product)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(product.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Category and performance badges */}
        <div className="flex items-center gap-2 mt-3">
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          )}
          <Badge className={`${performance.color} text-xs`}>
            {performance.label} Performance
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pt-0">
        {/* Price with animated emphasis */}
        <div className="mb-4">
          <div className={`
            text-2xl font-bold transition-all duration-300
            ${isHovered ? 'text-blue-700 scale-105' : 'text-gray-900'}
          `}>
            R$ {(product.basePrice || 0).toLocaleString('pt-BR')}
          </div>
          {product.recurringType && (
            <div className="text-sm text-gray-500">
              /{product.recurringType === 'monthly' ? 'mês' : 'ano'}
            </div>
          )}
        </div>

        {/* Metrics grid with hover animations */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`
            text-center p-2 rounded-lg transition-all duration-200
            ${isHovered ? 'bg-white/70 transform translate-y-[-2px]' : 'bg-gray-50'}
          `}>
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className={`
                h-4 w-4 transition-colors duration-200
                ${totalSales > 0 ? 'text-green-600' : 'text-gray-400'}
              `} />
            </div>
            <div className="text-sm font-semibold">{totalSales}</div>
            <div className="text-xs text-gray-500">Vendas</div>
          </div>

          <div className={`
            text-center p-2 rounded-lg transition-all duration-200
            ${isHovered ? 'bg-white/70 transform translate-y-[-2px]' : 'bg-gray-50'}
          `} style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-center mb-1">
              <DollarSign className={`
                h-4 w-4 transition-colors duration-200
                ${totalRevenue > 0 ? 'text-blue-600' : 'text-gray-400'}
              `} />
            </div>
            <div className="text-sm font-semibold">
              {totalRevenue > 0 ? `R$ ${(totalRevenue / 1000).toFixed(0)}k` : 'R$ 0'}
            </div>
            <div className="text-xs text-gray-500">Receita</div>
          </div>

          <div className={`
            text-center p-2 rounded-lg transition-all duration-200
            ${isHovered ? 'bg-white/70 transform translate-y-[-2px]' : 'bg-gray-50'}
          `} style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-center mb-1">
              <Star className={`
                h-4 w-4 transition-colors duration-200
                ${avgSaleValue > 0 ? 'text-yellow-600' : 'text-gray-400'}
              `} />
            </div>
            <div className="text-sm font-semibold">
              {avgSaleValue > 0 ? `R$ ${(avgSaleValue / 1000).toFixed(1)}k` : 'R$ 0'}
            </div>
            <div className="text-xs text-gray-500">Ticket Médio</div>
          </div>
        </div>

        {/* Action buttons with staggered animation */}
        <div className={`
          flex gap-2 transition-all duration-300
          ${isHovered ? 'opacity-100 transform translate-y-0' : 'opacity-80 transform translate-y-1'}
        `}>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
            onClick={() => onView(product)}
          >
            <Eye className="mr-2 h-3 w-3" />
            Ver Detalhes
          </Button>
          <Button 
            size="sm" 
            className="flex-1 transition-all duration-200 hover:scale-105"
            onClick={() => onEdit(product)}
          >
            <Edit className="mr-2 h-3 w-3" />
            Editar
          </Button>
        </div>
      </CardContent>

      {/* Subtle pulse animation for new products */}
      {performance.level === 'new' && (
        <div className="absolute inset-0 rounded-lg opacity-20 animate-pulse bg-blue-200" />
      )}

      {/* Shimmer effect for high performers */}
      {performance.level === 'high' && isHovered && (
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
        </div>
      )}
    </Card>
  );
}