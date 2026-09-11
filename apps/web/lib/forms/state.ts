/**
 * Não é um arquivo "use server": Next.js exige que todo export de um módulo
 * "use server" seja uma Server Action assíncrona, e `valoresDoFormulario` é
 * uma função síncrona utilitária — por isso vive num módulo comum, importado
 * tanto pelas actions quanto (indiretamente, via tipo) pelos componentes de
 * formulário.
 */

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  /**
   * Valores enviados no submit que falhou — usado por `useFormLifecycle`
   * (lib/forms/use-form-lifecycle.ts) para repor os campos depois que o
   * React reseta o <form> automaticamente ao final de toda Server Action,
   * mesmo quando ela só retornou um erro de validação em vez de lançar.
   * Nunca inclui campos de senha (ver `valoresDoFormulario`).
   */
  values?: Record<string, string>;
}

/** Extrai os campos de texto de um FormData para repopular o formulário em
 * caso de erro (ver `FormState.values`). Ignora arquivos (não há como
 * reatribuir um File a um <input type="file"> por segurança do browser) e
 * qualquer campo de senha, que nunca deve ser escrito de volta no DOM. */
export function valoresDoFormulario(formData: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [nome, valor] of formData.entries()) {
    if (typeof valor === "string" && !/senha|password/i.test(nome)) {
      valores[nome] = valor;
    }
  }
  return valores;
}
