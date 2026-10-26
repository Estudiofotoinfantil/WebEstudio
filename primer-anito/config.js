/* Propuesta Primer añito · Estudio Fotoinfantil — configuración
   PRECIOS: los links nuevos usan la lista "listaActual". Un link ya enviado conserva su lista
   mientras esté vigente (fecha "hasta" del link). Para cambiar precios: copiá la lista, ponele otro
   nombre (ej. "2026-12"), cambiá los valores y poné ese nombre en "listaActual".
   Escribí los precios sin puntos ni $ (65000). Respetá las comillas y las comas: si este archivo queda
   con un error, la propuesta muestra los valores con los que se publicó y el generador te avisa.
   FERIADOS / CERRADOS / COMPLETOS: fechas AAAA-MM-DD. Los turnos ocupados se leen solos del sistema de reservas. */
window.PRIMER_ANITO = {
  "whatsapp": "5491130448139",
  "reservasURL": "https://script.google.com/macros/s/AKfycbxlWQSw4Bj2PYrJlnUVC4QdpcYAVV0vIu-ZqenCTMEOgbolkSfKY_Gr1h140VeMAc3YXw/exec",
  "sena": 0.2,
  "vigenciaDias": 7,
  "listaActual": "2026-10",
  "listas": {
    "2026-10": {
      "esencial": 65000,
      "recuerdo": 89000,
      "historia": 119000,
      "cuadro": 39000,
      "carpeta": 18000,
      "calendario": 22000
    }
  },
  "horarios": {
    "semana": [
      "18:15",
      "19:15"
    ],
    "sabado": [
      "10:00",
      "11:00",
      "13:00",
      "14:00"
    ],
    "feriado": [
      "10:00",
      "11:00",
      "13:00",
      "14:00"
    ]
  },
  "feriados": [
    "2026-11-09",
    "2026-11-10",
    "2026-11-23",
    "2026-12-07",
    "2026-12-08",
    "2026-12-25",
    "2027-01-01",
    "2027-02-08",
    "2027-02-09",
    "2027-03-24",
    "2027-03-26",
    "2027-04-02",
    "2027-05-01",
    "2027-05-25",
    "2027-06-20",
    "2027-06-21",
    "2027-07-09",
    "2027-08-16",
    "2027-10-11",
    "2027-11-20",
    "2027-12-08",
    "2027-12-25"
  ],
  "cerrados": [
    "2026-12-24",
    "2026-12-25",
    "2026-12-31",
    "2027-01-01",
    "2027-12-24",
    "2027-12-25",
    "2027-12-31"
  ],
  "completos": []
};
