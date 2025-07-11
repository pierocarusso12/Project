iconos = {
    "vacio": " ",
    "subida": "⬆️",
    "bajada": "⬇️",
    "induccion": "📋",
    "perforacion": "🔨",
    "descanso": "☕"
}

def calcular_descanso(dias_trabajo):
    descanso_efectivo = max(4, round(dias_trabajo / 2))
    return ["⬇️"] + ["☕"] * (descanso_efectivo - 2) + ["⬆️"]  # Incluye bajada y subida

def construir_bloque(calendario, start_dia, total_dias, induccion_n, trabajo_dias, ya_inducido):
    dia = start_dia
    bloque = []

    # Subida
    if dia < total_dias:
        calendario[dia] = iconos["subida"]
        dia += 1

    # Inducción si no la tuvo aún
    if not ya_inducido:
        for _ in range(induccion_n):
            if dia < total_dias:
                calendario[dia] = iconos["induccion"]
                dia += 1

    # Trabajo
    trabajo_real = 0
    while trabajo_real < trabajo_dias and dia < total_dias:
        calendario[dia] = iconos["perforacion"]
        dia += 1
        trabajo_real += 1

    # Descanso
    descanso = calcular_descanso(trabajo_real)
    for d in descanso:
        if dia < total_dias:
            calendario[dia] = d
            dia += 1

    return dia, True  # Próximo día disponible, y ahora sí tuvo inducción

def generar_cronograma_induccion(total_dias, dias_induccion):
    S1 = [" " for _ in range(total_dias)]
    S2 = [" " for _ in range(total_dias)]
    S3 = [" " for _ in range(total_dias)]

    def marcar(l, indices, valor):
        for i in indices:
            if 0 <= i < total_dias:
                l[i] = valor

    # Supervisor 1
    marcar(S1, [0], "⬆️")
    marcar(S1, range(1, 1 + dias_induccion), "📋")
    marcar(S1, range(1 + dias_induccion, 1 + dias_induccion + 12), "🔨")
    if 1 + dias_induccion + 12 < total_dias:
        marcar(S1, [1 + dias_induccion + 12], "⬇️")
        marcar(S1, range(1 + dias_induccion + 13, 1 + dias_induccion + 13 + 5), "☕")

    # Supervisor 2
    marcar(S2, [0], "⬆️")
    marcar(S2, range(1, 1 + dias_induccion), "📋")
    marcar(S2, range(1 + dias_induccion, 1 + dias_induccion + 7), "🔨")
    baja_s2 = 1 + dias_induccion + 7
    if baja_s2 < total_dias:
        marcar(S2, [baja_s2], "⬇️")
        marcar(S2, range(baja_s2 + 1, baja_s2 + 4), "☕")

    # Supervisor 3
    subida_s3 = baja_s2 - 1
    marcar(S3, [subida_s3], "⬆️")
    marcar(S3, range(subida_s3 + 1, subida_s3 + 1 + dias_induccion), "📋")
    marcar(S3, range(subida_s3 + 1 + dias_induccion, subida_s3 + 1 + dias_induccion + 12), "🔨")
    if subida_s3 + 1 + dias_induccion + 12 < total_dias:
        marcar(S3, [subida_s3 + 1 + dias_induccion + 12], "⬇️")
        marcar(S3, range(subida_s3 + 1 + dias_induccion + 13, subida_s3 + 1 + dias_induccion + 13 + 5), "☕")

    return [S1, S2, S3]

def imprimir_cronograma_supervisores(supervisores, total_dias):
    print("Día:         " + "".join([f"D{d:02}  " for d in range(total_dias)]))
    for idx, linea in enumerate(supervisores):
        fila = f"Supervisor {idx+1}: " + "".join(f"{item:<4}" for item in linea)
        print(fila)

# Ejecutar cronogramas para 3, 4 y 5 días de inducción
for dias_induccion in [3, 4, 5]:
    print(f"\n=== CRONOGRAMA PARA {dias_induccion} DÍAS DE INDUCCIÓN ===\n")
    cronograma = generar_cronograma_induccion(30, dias_induccion)
    imprimir_cronograma_supervisores(cronograma, 30)
