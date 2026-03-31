export async function fetchCnpjData(cnpj: string) {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return null;

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
    if (!response.ok) return null;
    const data = await response.json();

    return {
      name: data.razao_social || "",
      contactPerson: data.nome_fantasia || "",
      email: data.email || "",
      phone: data.ddd_telefone_1 || "",
      cep: data.cep || "",
      street: data.logradouro || "",
      number: data.numero || "",
      complement: data.complemento || "",
      neighborhood: data.bairro || "",
      city: data.municipio || "",
      state: data.uf || "",
    };
  } catch {
    return null;
  }
}
