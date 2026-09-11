"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { salvarLojaDescoberta } from "../../../../lib/mercado/actions";

function iconeCirculo(cor: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${cor};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const ICONE_OBRA = iconeCirculo("#2563eb");
const ICONE_LOJA_SALVA = iconeCirculo("#16a34a");
const ICONE_LOJA_DESCOBERTA = iconeCirculo("#d97706");

export interface LojaMapa {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  tipo?: string | null;
}

export interface LojaDescobertaMapa {
  osmId: string;
  nome: string;
  categoria: string | null;
  latitude: number;
  longitude: number;
  enderecoAproximado: string | null;
}

export function LojasMap({
  obra,
  lojasSalvas,
  lojasDescobertas,
}: {
  obra: { nome: string; latitude: number; longitude: number };
  lojasSalvas: LojaMapa[];
  lojasDescobertas: LojaDescobertaMapa[];
}) {
  return (
    <div className="h-96 w-full overflow-hidden rounded-lg border border-[var(--color-border)]">
      <MapContainer center={[obra.latitude, obra.longitude]} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[obra.latitude, obra.longitude]} icon={ICONE_OBRA}>
          <Popup>
            <strong>{obra.nome}</strong>
            <br />
            Localização da obra
          </Popup>
        </Marker>
        {lojasSalvas.map((loja) => (
          <Marker key={loja.id} position={[loja.latitude, loja.longitude]} icon={ICONE_LOJA_SALVA}>
            <Popup>
              <strong>{loja.nome}</strong>
              <br />
              Já está no seu catálogo
            </Popup>
          </Marker>
        ))}
        {lojasDescobertas.map((loja) => (
          <Marker key={loja.osmId} position={[loja.latitude, loja.longitude]} icon={ICONE_LOJA_DESCOBERTA}>
            <Popup>
              <div className="flex flex-col gap-1.5">
                <strong>{loja.nome}</strong>
                {loja.enderecoAproximado ? <span className="text-xs">{loja.enderecoAproximado}</span> : null}
                <form action={salvarLojaDescoberta}>
                  <input type="hidden" name="osmId" value={loja.osmId} />
                  <input type="hidden" name="nome" value={loja.nome} />
                  <input type="hidden" name="categoria" value={loja.categoria ?? ""} />
                  <input type="hidden" name="latitude" value={loja.latitude} />
                  <input type="hidden" name="longitude" value={loja.longitude} />
                  <input type="hidden" name="endereco" value={loja.enderecoAproximado ?? ""} />
                  <button type="submit" className="mt-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                    Salvar no catálogo
                  </button>
                </form>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
