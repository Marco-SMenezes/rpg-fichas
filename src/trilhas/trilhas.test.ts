import { describe, expect, it } from 'vitest'
import { moverItem, normalizarTrilhas, novaCena, novaFaixa, reconhecerLink, tamanhoDasTrilhas } from './trilhas'

describe('reconhecerLink', () => {
  it('YouTube: vídeo, link curto e playlist, ignorando parâmetros extras', () => {
    expect(reconhecerLink('https://youtu.be/dQw4w9WgXcQ?si=abc')).toEqual({ servico: 'youtube', recurso: 'dQw4w9WgXcQ' })
    expect(reconhecerLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s')).toEqual({ servico: 'youtube', recurso: 'dQw4w9WgXcQ' })
    expect(reconhecerLink('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({ servico: 'youtube', recurso: 'dQw4w9WgXcQ' })
    expect(reconhecerLink('https://www.youtube.com/playlist?list=PL123abc')).toEqual({ servico: 'youtube', recurso: 'playlist:PL123abc' })
    expect(reconhecerLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123abc')).toEqual({ servico: 'youtube', recurso: 'playlist:PL123abc' })
  })
  it('Spotify: faixa, playlist com idioma, álbum e URI', () => {
    expect(reconhecerLink('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=y')).toEqual({
      servico: 'spotify',
      recurso: 'track:4uLU6hMCjMI75M1A2tKUQC',
    })
    expect(reconhecerLink('https://open.spotify.com/intl-pt/playlist/37i9dQZF1DX')).toEqual({ servico: 'spotify', recurso: 'playlist:37i9dQZF1DX' })
    expect(reconhecerLink('https://open.spotify.com/album/1A2B3C')).toEqual({ servico: 'spotify', recurso: 'album:1A2B3C' })
    expect(reconhecerLink('spotify:track:4uLU6hMCjMI75M1A2tKUQC')).toEqual({ servico: 'spotify', recurso: 'track:4uLU6hMCjMI75M1A2tKUQC' })
  })
  it('qualquer outra coisa vira link simples, sem quebrar', () => {
    expect(reconhecerLink('https://exemplo.com/a.mp3')).toEqual({ servico: 'link', recurso: '' })
    expect(reconhecerLink('não é um link')).toEqual({ servico: 'link', recurso: '' })
    expect(reconhecerLink('')).toEqual({ servico: 'link', recurso: '' })
    expect(reconhecerLink('https://www.youtube.com/channel/UCxyz')).toEqual({ servico: 'link', recurso: '' })
  })
})

describe('normalizarTrilhas', () => {
  it('dado ausente ou corrompido vira lista vazia', () => {
    for (const ruim of [null, undefined, {}, { cenas: 'x' }, 42, 'texto']) expect(normalizarTrilhas(ruim)).toEqual({ cenas: [] })
  })
  it('completa ids, descarta faixas inválidas e reconhece o serviço', () => {
    const t = normalizarTrilhas({
      cenas: [
        { nome: 'Taverna', faixas: [{ url: 'https://youtu.be/dQw4w9WgXcQ' }, { url: 5 }, null, { url: 'https://exemplo.com/x', nome: 'Meu som' }] },
        null,
        { faixas: [] },
      ],
    })
    expect(t.cenas).toHaveLength(2)
    expect(t.cenas[0]!.id).toBeTruthy()
    expect(t.cenas[0]!.faixas).toHaveLength(2)
    expect(t.cenas[0]!.faixas[0]).toMatchObject({ servico: 'youtube', recurso: 'dQw4w9WgXcQ' })
    expect(t.cenas[0]!.faixas[1]).toMatchObject({ servico: 'link', nome: 'Meu som' })
    expect(t.cenas[1]!.nome).toBe('Cena')
  })
})

describe('criação e ordem', () => {
  it('nome da faixa em branco vira o endereço do site', () => {
    expect(novaFaixa('https://exemplo.com/a.mp3').nome).toBe('exemplo.com')
    expect(novaFaixa('https://youtu.be/dQw4w9WgXcQ', 'Combate épico').nome).toBe('Combate épico')
    expect(novaCena('  ').nome).toBe('Cena')
  })
  it('moverItem não muta a lista e ignora índices fora', () => {
    const a = [1, 2, 3]
    expect(moverItem(a, 0, 2)).toEqual([2, 3, 1])
    expect(a).toEqual([1, 2, 3])
    expect(moverItem(a, 0, -1)).toEqual([1, 2, 3])
    expect(moverItem(a, 5, 0)).toEqual([1, 2, 3])
  })
  it('mede o tamanho em bytes do JSON', () => {
    expect(tamanhoDasTrilhas({ cenas: [] })).toBe('{"cenas":[]}'.length)
    expect(tamanhoDasTrilhas({ cenas: [novaCena('Ação')] })).toBeGreaterThan(20)
  })
})
