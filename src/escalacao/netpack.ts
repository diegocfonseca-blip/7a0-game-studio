// 📦 COMPRESSÃO do estado que trafega no online (host → convidados) e do save da
// sala no banco. O estado completo do jogo (elencos, baralho, bios, monte…) chega
// a ~80-150 KB e ESTOURAVA o limite de tamanho de mensagem do Supabase Realtime
// ("Payload size exceeds tenant limit" → mensagem DESCARTADA → convidado travava
// no "Enviando…"/"host caiu"). Comprimindo, o mesmo estado vira ~10-20 KB, com
// folga enorme. Mantém 100% dos dados (nada é cortado), então nada mais muda:
// troca de host, telas, reconexão — tudo continua igual, só que empacotado.
//
// Motor: lz-string (Pieroxy, MIT) — implementação canônica vendorizada aqui pra
// NÃO adicionar dependência nova no npm num jogo em produção. compressToBase64
// gera ASCII puro (1 byte por char no fio), então o tamanho no Realtime é
// previsível. `pack`/`unpack` embrulham JSON.stringify/parse.

const keyStrBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

function _compress(uncompressed: string | null, bitsPerChar: number, getCharFromInt: (i: number) => string): string {
  if (uncompressed == null) return ''
  let i: number, value: number
  const context_dictionary: Record<string, number> = {}
  const context_dictionaryToCreate: Record<string, boolean> = {}
  let context_c = ''
  let context_wc = ''
  let context_w = ''
  let context_enlargeIn = 2
  let context_dictSize = 3
  let context_numBits = 2
  const context_data: string[] = []
  let context_data_val = 0
  let context_data_position = 0

  for (let ii = 0; ii < uncompressed.length; ii += 1) {
    context_c = uncompressed.charAt(ii)
    if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
      context_dictionary[context_c] = context_dictSize++
      context_dictionaryToCreate[context_c] = true
    }
    context_wc = context_w + context_c
    if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
      context_w = context_wc
    } else {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i++) {
            context_data_val = context_data_val << 1
            if (context_data_position === bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0 } else context_data_position++
          }
          value = context_w.charCodeAt(0)
          for (i = 0; i < 8; i++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position === bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0 } else context_data_position++
            value = value >> 1
          }
        } else {
          value = 1
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | value
            if (context_data_position === bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0 } else context_data_position++
            value = 0
          }
          value = context_w.charCodeAt(0)
          for (i = 0; i < 16; i++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position === bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0 } else context_data_position++
            value = value >> 1
          }
        }
        context_enlargeIn--
        if (context_enlargeIn === 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++ }
        delete context_dictionaryToCreate[context_w]
      } else {
        value = context_dictionary[context_w]
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position === bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0 } else context_data_position++
          value = value >> 1
        }
      }
      context_enlargeIn--
      if (context_enlargeIn === 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++ }
      context_dictionary[context_wc] = context_dictSize++
      context_w = String(context_c)
    }
  }

  if (context_w !== '') {
    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
      if (context_w.charCodeAt(0) < 256) {
        for (i = 0; i < context_numBits; i++) {
          context_data_val = context_data_val << 1
          if (context_data_position === bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0 } else context_data_position++
        }
        value = context_w.charCodeAt(0)
        for (i = 0; i < 8; i++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position === bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0 } else context_data_position++
          value = value >> 1
        }
      } else {
        value = 1
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | value
          if (context_data_position === bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0 } else context_data_position++
          value = 0
        }
        value = context_w.charCodeAt(0)
        for (i = 0; i < 16; i++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position === bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0 } else context_data_position++
          value = value >> 1
        }
      }
      context_enlargeIn--
      if (context_enlargeIn === 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++ }
      delete context_dictionaryToCreate[context_w]
    } else {
      value = context_dictionary[context_w]
      for (i = 0; i < context_numBits; i++) {
        context_data_val = (context_data_val << 1) | (value & 1)
        if (context_data_position === bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0 } else context_data_position++
        value = value >> 1
      }
    }
    context_enlargeIn--
    if (context_enlargeIn === 0) { context_enlargeIn = Math.pow(2, context_numBits); context_numBits++ }
  }

  value = 2
  for (i = 0; i < context_numBits; i++) {
    context_data_val = (context_data_val << 1) | (value & 1)
    if (context_data_position === bitsPerChar - 1) { context_data_position = 0; context_data.push(getCharFromInt(context_data_val)); context_data_val = 0 } else context_data_position++
    value = value >> 1
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    context_data_val = context_data_val << 1
    if (context_data_position === bitsPerChar - 1) { context_data.push(getCharFromInt(context_data_val)); break } else context_data_position++
  }
  return context_data.join('')
}

function _decompress(length: number, resetValue: number, getNextValue: (i: number) => number): string | null {
  const dictionary: (string | number)[] = []
  let enlargeIn = 4
  let dictSize = 4
  let numBits = 3
  let entry = ''
  const result: string[] = []
  let w: string
  let bits: number, resb: number, maxpower: number, power: number
  let c: string | number = ''
  const data = { val: getNextValue(0), position: resetValue, index: 1 }

  for (let i = 0; i < 3; i += 1) dictionary[i] = i

  bits = 0; maxpower = Math.pow(2, 2); power = 1
  while (power !== maxpower) {
    resb = data.val & data.position
    data.position >>= 1
    if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++) }
    bits |= (resb > 0 ? 1 : 0) * power
    power <<= 1
  }

  switch (bits) {
    case 0:
      bits = 0; maxpower = Math.pow(2, 8); power = 1
      while (power !== maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++) } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1 }
      c = String.fromCharCode(bits)
      break
    case 1:
      bits = 0; maxpower = Math.pow(2, 16); power = 1
      while (power !== maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++) } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1 }
      c = String.fromCharCode(bits)
      break
    case 2:
      return ''
  }
  dictionary[3] = c
  w = c as string
  result.push(c as string)

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (data.index > length) return ''
    bits = 0; maxpower = Math.pow(2, numBits); power = 1
    while (power !== maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++) } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1 }

    let cc: number = bits
    switch (cc) {
      case 0:
        bits = 0; maxpower = Math.pow(2, 8); power = 1
        while (power !== maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++) } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1 }
        dictionary[dictSize++] = String.fromCharCode(bits)
        cc = dictSize - 1
        enlargeIn--
        break
      case 1:
        bits = 0; maxpower = Math.pow(2, 16); power = 1
        while (power !== maxpower) { resb = data.val & data.position; data.position >>= 1; if (data.position === 0) { data.position = resetValue; data.val = getNextValue(data.index++) } bits |= (resb > 0 ? 1 : 0) * power; power <<= 1 }
        dictionary[dictSize++] = String.fromCharCode(bits)
        cc = dictSize - 1
        enlargeIn--
        break
      case 2:
        return result.join('')
    }

    if (enlargeIn === 0) { enlargeIn = Math.pow(2, numBits); numBits++ }

    if (dictionary[cc]) {
      entry = dictionary[cc] as string
    } else {
      if (cc === dictSize) entry = w + w.charAt(0)
      else return null
    }
    result.push(entry)
    dictionary[dictSize++] = w + entry.charAt(0)
    enlargeIn--
    w = entry
    if (enlargeIn === 0) { enlargeIn = Math.pow(2, numBits); numBits++ }
  }
}

function compressToBase64(input: string | null): string {
  if (input == null) return ''
  const res = _compress(input, 6, (a) => keyStrBase64.charAt(a))
  switch (res.length % 4) {
    default:
    case 0: return res
    case 1: return res + '==='
    case 2: return res + '=='
    case 3: return res + '='
  }
}

function decompressFromBase64(input: string | null): string | null {
  if (input == null) return ''
  if (input === '') return null
  const baseReverseDic: Record<string, number> = {}
  for (let i = 0; i < keyStrBase64.length; i++) baseReverseDic[keyStrBase64.charAt(i)] = i
  return _decompress(input.length, 32, (index) => baseReverseDic[input.charAt(index)])
}

// 📦 embrulho de conveniência: objeto → string comprimida (base64) e volta.
export function pack(obj: unknown): string {
  return compressToBase64(JSON.stringify(obj))
}

export function unpack<T = unknown>(packed: string): T {
  const json = decompressFromBase64(packed)
  return JSON.parse(json || 'null') as T
}
