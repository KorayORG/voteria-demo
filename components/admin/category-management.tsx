"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tags, ArrowLeftRight } from "lucide-react"
import { useAdminData } from "@/hooks/use-admin-data"

export function CategoryManagement() {
  const { categorySchema } = useAdminData()

  if (!categorySchema) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-300">Kategori şeması yükleniyor...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700 card-3d shadow-3d">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Tags className="h-5 w-5 text-green-500" />
            Kategori Yönetimi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mutual Pairs */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-orange-500" />
              Karşılıklı Kategori Çiftleri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorySchema.mutualPairs.map((pair) => (
                <Card key={pair.key} className="bg-gray-700/50 border-gray-600">
                  <CardContent className="p-4">
                    <h4 className="text-white font-medium mb-3 text-center">{pair.key}</h4>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">{pair.left}</Badge>
                      <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{pair.right}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Single Tags */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Tags className="h-5 w-5 text-green-500" />
              Tekil Etiketler
            </h3>
            <div className="flex flex-wrap gap-2">
              {categorySchema.singleTags.map((tag) => (
                <Badge key={tag} className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Schema Info */}
          <div className="pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Şema Versiyonu: {categorySchema.version}</span>
              <span className="text-gray-400">Oluşturulma: {categorySchema.createdAt.toLocaleDateString("tr-TR")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
