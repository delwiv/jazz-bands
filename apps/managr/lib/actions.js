const build = (type, payload) => ({ payload, type })

export default actionName => {
  const failed = `${actionName}_FAILED`
  const requested = `${actionName}_REQUESTED`
  const succeeded = `${actionName}_SUCCEEDED`
  return {
    failed,
    requested,
    succeeded,
    fail: payload => build(failed, payload),
    request: payload => build(requested, payload),
    succeed: payload => build(succeeded, payload),
  }
}
