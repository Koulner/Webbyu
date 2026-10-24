export interface Variant { label: string; size: string; price: number; stock: number }
export interface Product {
  id: string; name: string; kind: string; category: string; image: string; material: string;
  description: string; care: string; variants: Variant[]; previous?: number; fresh?: boolean;
}
export const products: Product[] = [
  { id: 'lino', name: 'LINO', kind: 'Loungesessel', category: 'Sitzmöbel', image: 'chair', material: 'Bouclé',
    description: 'Eine sanfte Rundung, ein großzügiger Sitz. Lino bringt mit seinem strukturierten, cremefarbenen Bezug Ruhe in die Leseecke.',
    care: 'Mit einer weichen Polsterbürste absaugen. Flüssigkeiten sofort mit einem trockenen Tuch aufnehmen.',
    variants: [{ label: 'Bouclé · Natur', size: '82 × 78 × 74 cm', price: 44900, stock: 8 }], previous: 54900 },
  { id: 'nori', name: 'NORI', kind: 'Couchtisch', category: 'Tische', image: 'table', material: 'Walnuss',
    description: 'Runde Formen treffen auf die Tiefe von Walnussholz. Drei skulpturale Beine tragen eine klare, massive Tischplatte.',
    care: 'Nebelfeucht reinigen und trocken nachwischen. Untersetzer schützen das geölte Holz vor Rändern.',
    variants: [{ label: 'Ø 80 cm', size: 'Ø 80 × 34 cm', price: 32900, stock: 6 }, { label: 'Ø 100 cm', size: 'Ø 100 × 34 cm', price: 42900, stock: 3 }], previous: 39900 },
  { id: 'luma', name: 'LUMA', kind: 'Tischleuchte', category: 'Leuchten', image: 'lamp', material: 'Glas & Messing',
    description: 'Opalglas verteilt das Licht weich im Raum. Messing und dunkles Holz setzen einen warmen Akzent auf Konsole oder Nachttisch.',
    care: 'Ausgeschaltet mit einem trockenen, weichen Tuch reinigen. Beispiel-Fassung E27; Leuchtmittel separat.',
    variants: [{ label: 'Opal · Messing', size: 'Ø 28 × 44 cm', price: 12900, stock: 12 }], fresh: true },
  { id: 'faro', name: 'FARO', kind: 'Sideboard', category: 'Stauraum', image: 'sideboard', material: 'Walnuss',
    description: 'Feine vertikale Linien, großzügiger Stauraum. Vier Türen verbergen das Alltägliche hinter einer ruhigen Holzfront.',
    care: 'Mit einem leicht feuchten Tuch pflegen. Für Möbel dieser Größe ist eine fachgerechte Kippsicherung vorgesehen.',
    variants: [{ label: '160 cm', size: '160 × 42 × 72 cm', price: 89900, stock: 4 }, { label: '200 cm', size: '200 × 42 × 72 cm', price: 109900, stock: 0 }], fresh: true },
  { id: 'terra', name: 'TERRA', kind: 'Keramikvase', category: 'Accessoires', image: 'vase', material: 'Keramik',
    description: 'Ein kleines Objekt mit großer Präsenz. Die matte Oberfläche und die organischen Henkel machen Terra auch ohne Blumen besonders.',
    care: 'Von Hand reinigen. Als dekorative Vase für Trockenblumen konzipiert; kein wasserdichtes Gefäß.',
    variants: [{ label: '28 cm', size: '24 × 18 × 28 cm', price: 4900, stock: 16 }, { label: '38 cm', size: '30 × 22 × 38 cm', price: 6900, stock: 7 }], previous: 6900 },
  { id: 'sora', name: 'SORA', kind: 'Wandspiegel', category: 'Accessoires', image: 'mirror', material: 'Eiche & Glas',
    description: 'Die freie Form bringt Leichtigkeit an die Wand. Ein schmaler Eichenrahmen fasst Licht und neue Perspektiven ein.',
    care: 'Glasreiniger auf das Tuch geben, nicht auf den Rahmen. Wandbefestigung passend zum Untergrund wählen.',
    variants: [{ label: '70 cm', size: '54 × 3 × 70 cm', price: 17900, stock: 5 }, { label: '100 cm', size: '76 × 3 × 100 cm', price: 24900, stock: 2 }], fresh: true },
];
export const categories = ['Alle', 'Sitzmöbel', 'Tische', 'Leuchten', 'Stauraum', 'Accessoires'];
export const money = (cents: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
export interface CartLine { id: string; variant: number; quantity: number }
export function getProduct(id: string): Product { return products.find(product => product.id === id)!; }
export function cartTotal(cart: CartLine[]): number { return cart.reduce((sum, line) => sum + getProduct(line.id).variants[line.variant].price * line.quantity, 0); }
export function setQuantity(cart: CartLine[], id: string, variant: number, quantity: number): CartLine[] {
  const product = products.find(item => item.id === id), choice = product?.variants[variant];
  if (!choice || !Number.isFinite(quantity)) return cart;
  const safe = Math.min(choice.stock, Math.max(0, Math.floor(quantity)));
  const others = cart.filter(line => line.id !== id || line.variant !== variant);
  const result = cart.map(line => line.id === id && line.variant === variant ? { ...line, quantity: safe } : line);
  return safe === 0 ? others : cart.some(line => line.id === id && line.variant === variant) ? result : [...cart, { id, variant, quantity: safe }];
}
export interface Filters { query: string; category: string; max: number; available: boolean; offers: boolean; fresh: boolean; sort: string }
const normalize = (text: string) => text.toLocaleLowerCase('de').normalize('NFD').replace(/\p{Diacritic}/gu, '');
export function findProducts(filters: Filters): Product[] {
  const words = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
  const result = products.filter(product =>
    words.every(word => normalize(`${product.name} ${product.kind} ${product.category} ${product.material}`).includes(word)) &&
    (filters.category === 'Alle' || product.category === filters.category) &&
    product.variants.some(variant => variant.price <= filters.max && (!filters.available || variant.stock > 0)) &&
    (!filters.offers || Boolean(product.previous)) && (!filters.fresh || product.fresh));
  if (filters.sort === 'asc') result.sort((a, b) => a.variants[0].price - b.variants[0].price);
  if (filters.sort === 'desc') result.sort((a, b) => b.variants[0].price - a.variants[0].price);
  if (filters.sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
