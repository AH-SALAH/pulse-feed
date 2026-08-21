import type { ComponentType } from "react";
import { LuCoins } from "react-icons/lu";
import {
  SiBinance,
  SiBitcoin,
  SiCardano,
  SiChainlink,
  SiDogecoin,
  SiEthereum,
  SiPolkadot,
  SiPolygon,
  SiSolana,
  SiXrp,
  SiAvaloniaui
} from "react-icons/si";

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const COIN_ICONS: Record<string, IconComponent> = {
  BTC: SiBitcoin,
  ETH: SiEthereum,
  SOL: SiSolana,
  BNB: SiBinance,
  ADA: SiCardano,
  DOT: SiPolkadot,
  MATIC: SiPolygon,
  DOGE: SiDogecoin,
  XRP: SiXrp,
  LINK: SiChainlink,
  AVAX: SiAvaloniaui
};

interface CoinIconProps {
  symbol: string;
  className?: string;
}

export default function CoinIcon({ symbol, className }: CoinIconProps) {
  const Icon = COIN_ICONS[symbol.toUpperCase()] ?? LuCoins;
  return <Icon aria-hidden={true} className={className} />;
}